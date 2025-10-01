package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"runtime/debug"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/pprof"

	"expense-tracker/internal/config"
	"expense-tracker/internal/controllers"
	"expense-tracker/internal/database"
	"expense-tracker/internal/middleware"
	"expense-tracker/internal/repositories"
	"expense-tracker/internal/services"
	"expense-tracker/internal/utils"
)

func main() {

	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	if cfg.Performance.GOMAXPROCS > 0 {
		runtime.GOMAXPROCS(cfg.Performance.GOMAXPROCS)
	} else {
		runtime.GOMAXPROCS(runtime.NumCPU())
	}

	if cfg.Performance.GOMEMLIMIT > 0 {
		debug.SetMemoryLimit(cfg.Performance.GOMEMLIMIT)
	}

	if cfg.Performance.GOGC > 0 {
		debug.SetGCPercent(cfg.Performance.GOGC)
	}

	utils.InitLogger()
	utils.Info("Starting expense tracker application")

	db, err := database.Connect(cfg)
	if err != nil {
		utils.Fatal("Failed to connect to database", utils.ErrField(err))
		log.Fatal("Failed to connect to database:", err)
	}

	if err := database.RunMigrations(db, cfg); err != nil {
		utils.Fatal("Failed to run migrations", utils.ErrField(err))
		log.Fatal("Failed to run migrations:", err)
	}

	var elasticsearchService *services.ElasticsearchService
	if cfg.Elasticsearch.URL != "" {
		elasticsearchService, err = services.NewElasticsearchService(cfg)
		if err != nil {
			utils.Warn("Failed to initialize Elasticsearch service", utils.ErrField(err))
		} else {
			utils.Info("Elasticsearch service initialized successfully")
		}
	} else {
		utils.Info("Elasticsearch not configured, skipping initialization")
	}

	userRepo := repositories.NewUserRepository(db)
	transactionRepo := repositories.NewTransactionRepository(db)
	categoryRepo := repositories.NewCategoryRepository(db)
	budgetRepo := repositories.NewBudgetRepository(db)
	tagRepo := repositories.NewTagRepository(db)

	authService := services.NewAuthService(userRepo, cfg)
	expenseService := services.NewExpenseService(transactionRepo, categoryRepo, tagRepo, elasticsearchService)
	categoryService := services.NewCategoryService(categoryRepo)
	budgetService := services.NewBudgetService(budgetRepo)
	reportService := services.NewReportService(transactionRepo, budgetRepo)
	fileService := services.NewFileService(cfg)
	tagService := services.NewTagService(tagRepo)

	authController := controllers.NewAuthController(authService)
	expenseController := controllers.NewExpenseController(expenseService)
	categoryController := controllers.NewCategoryController(categoryService)
	budgetController := controllers.NewBudgetController(budgetService)
	reportController := controllers.NewReportController(reportService)
	fileController := controllers.NewFileController(fileService)
	tagController := controllers.NewTagController(tagService)

	r := setupRoutes(cfg, authController, expenseController, categoryController,
		budgetController, reportController, fileController, tagController)

	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	go func() {
		utils.Info("Starting server", utils.String("port", cfg.Server.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.Fatal("Failed to start server", utils.ErrField(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	utils.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		utils.Fatal("Server forced to shutdown:", utils.ErrField(err))
	}

	utils.Info("Server exiting")
}

func setupRoutes(cfg *config.Config, authCtrl *controllers.AuthController,
	expenseCtrl *controllers.ExpenseController,
	categoryCtrl *controllers.CategoryController,
	budgetCtrl *controllers.BudgetController,
	reportCtrl *controllers.ReportController,
	fileCtrl *controllers.FileController,
	tagCtrl *controllers.TagController) *gin.Engine {

	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	r := gin.Default()

	r.Use(middleware.CORS())
	r.Use(middleware.Logger())

	auth := r.Group("/api/auth")
	{
		auth.POST("/signup", authCtrl.SignUp)
		auth.POST("/login", authCtrl.Login)
		auth.POST("/forgot-password", authCtrl.ForgotPassword)
		auth.POST("/reset-password", authCtrl.ResetPassword)
	}

	protected := r.Group("/api")
	protected.Use(middleware.AuthRequired(cfg.JWT.Secret))
	{

		protected.GET("/profile", authCtrl.GetProfile)
		protected.PUT("/profile", authCtrl.UpdateProfile)
		protected.POST("/logout", authCtrl.Logout)

		protected.GET("/categories", categoryCtrl.GetCategories)
		protected.POST("/categories", categoryCtrl.CreateCategory)
		protected.PUT("/categories/:id", categoryCtrl.UpdateCategory)
		protected.DELETE("/categories/:id", categoryCtrl.DeleteCategory)

		protected.GET("/tags", tagCtrl.GetTags)

		protected.GET("/expenses", expenseCtrl.GetExpenses)
		protected.POST("/expenses", expenseCtrl.CreateExpense)
		protected.GET("/expenses/:id", expenseCtrl.GetExpense)
		protected.PUT("/expenses/:id", expenseCtrl.UpdateExpense)
		protected.DELETE("/expenses/:id", expenseCtrl.DeleteExpense)

		protected.GET("/budgets", budgetCtrl.GetBudgets)
		protected.POST("/budgets", budgetCtrl.CreateBudget)
		protected.PUT("/budgets/:id", budgetCtrl.UpdateBudget)
		protected.DELETE("/budgets/:id", budgetCtrl.DeleteBudget)

		protected.GET("/reports/summary", reportCtrl.GetSummary)
		protected.GET("/reports/trends", reportCtrl.GetTrends)
		protected.GET("/reports/category-breakdown", reportCtrl.GetCategoryBreakdown)
		protected.GET("/reports/budget-analysis", reportCtrl.GetBudgetAnalysis)

		protected.POST("/upload/receipt", fileCtrl.UploadReceipt)
		protected.POST("/import/csv", fileCtrl.ImportCSV)
		protected.GET("/export/csv", fileCtrl.ExportCSV)
	}

	r.GET("/health", func(c *gin.Context) {
		utils.Info("Health check endpoint called")
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Service is healthy",
		})
	})

    
	if cfg.Performance.EnableProfiling {
		// Register pprof routes
		pprof.Register(r)
		utils.Info("Pprof enabled at /debug/pprof/")
		
		// Print all registered routes for debugging
		routes := r.Routes()
		for _, route := range routes {
			if route.Path == "/debug/pprof/" {
				utils.Info("Found pprof route:", utils.String("path", route.Path), utils.String("method", route.Method))
			}
		}
	} else {
		utils.Info("Profiling is disabled in configuration")
	}

	return r
}
