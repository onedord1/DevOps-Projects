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

	"expense-tracker/internal/config"
	"expense-tracker/internal/controllers"
	"expense-tracker/internal/database"
	"expense-tracker/internal/middleware"
	"expense-tracker/internal/repositories"
	"expense-tracker/internal/services"
	"expense-tracker/internal/utils"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Optimize runtime for high concurrency
	if cfg.Performance.GOMAXPROCS > 0 {
		runtime.GOMAXPROCS(cfg.Performance.GOMAXPROCS)
	} else {
		runtime.GOMAXPROCS(runtime.NumCPU())
	}

	// Set memory limit to help GC make better decisions
	if cfg.Performance.GOMEMLIMIT > 0 {
		debug.SetMemoryLimit(cfg.Performance.GOMEMLIMIT)
	}

	// Set GC target percentage
	if cfg.Performance.GOGC > 0 {
		debug.SetGCPercent(cfg.Performance.GOGC)
	}

	// Initialize logger first
	utils.InitLogger()
	utils.Info("Starting expense tracker application")

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		utils.Fatal("Failed to connect to database", utils.ErrField(err))
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.RunMigrations(db, cfg); err != nil {
		utils.Fatal("Failed to run migrations", utils.ErrField(err))
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize Elasticsearch service (optional)
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

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	transactionRepo := repositories.NewTransactionRepository(db)
	categoryRepo := repositories.NewCategoryRepository(db)
	budgetRepo := repositories.NewBudgetRepository(db)
	tagRepo := repositories.NewTagRepository(db)

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg)
	expenseService := services.NewExpenseService(transactionRepo, categoryRepo, tagRepo, elasticsearchService)
	categoryService := services.NewCategoryService(categoryRepo)
	budgetService := services.NewBudgetService(budgetRepo)
	reportService := services.NewReportService(transactionRepo, budgetRepo)
	fileService := services.NewFileService(cfg)
	tagService := services.NewTagService(tagRepo)

	// Initialize controllers
	authController := controllers.NewAuthController(authService)
	expenseController := controllers.NewExpenseController(expenseService)
	categoryController := controllers.NewCategoryController(categoryService)
	budgetController := controllers.NewBudgetController(budgetService)
	reportController := controllers.NewReportController(reportService)
	fileController := controllers.NewFileController(fileService)
	tagController := controllers.NewTagController(tagService)

	// Setup routes
	r := setupRoutes(cfg, authController, expenseController, categoryController,
		budgetController, reportController, fileController, tagController)

	// Create HTTP server with optimized settings
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	// Start server in a goroutine
	go func() {
		utils.Info("Starting server", utils.String("port", cfg.Server.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.Fatal("Failed to start server", utils.ErrField(err))
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	utils.Info("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
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

	// Set Gin mode based on environment
	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	r := gin.Default()

	// Middleware
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())

	// Add performance monitoring middleware
	// perfService := services.NewPerformanceService()
	// r.Use(middleware.Performance(perfService))

	// Public routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/signup", authCtrl.SignUp)
		auth.POST("/login", authCtrl.Login)
		auth.POST("/forgot-password", authCtrl.ForgotPassword)
		auth.POST("/reset-password", authCtrl.ResetPassword)
	}

	// Protected routes
	protected := r.Group("/api")
	protected.Use(middleware.AuthRequired(cfg.JWT.Secret))
	{
		// User profile
		protected.GET("/profile", authCtrl.GetProfile)
		protected.PUT("/profile", authCtrl.UpdateProfile)
		protected.POST("/logout", authCtrl.Logout)

		// Categories
		protected.GET("/categories", categoryCtrl.GetCategories)
		protected.POST("/categories", categoryCtrl.CreateCategory)
		protected.PUT("/categories/:id", categoryCtrl.UpdateCategory)
		protected.DELETE("/categories/:id", categoryCtrl.DeleteCategory)

		// Tags
		protected.GET("/tags", tagCtrl.GetTags)

		// Expenses
		protected.GET("/expenses", expenseCtrl.GetExpenses)
		protected.POST("/expenses", expenseCtrl.CreateExpense)
		protected.GET("/expenses/:id", expenseCtrl.GetExpense)
		protected.PUT("/expenses/:id", expenseCtrl.UpdateExpense)
		protected.DELETE("/expenses/:id", expenseCtrl.DeleteExpense)

		// Budgets
		protected.GET("/budgets", budgetCtrl.GetBudgets)
		protected.POST("/budgets", budgetCtrl.CreateBudget)
		protected.PUT("/budgets/:id", budgetCtrl.UpdateBudget)
		protected.DELETE("/budgets/:id", budgetCtrl.DeleteBudget)

		// Reports
		protected.GET("/reports/summary", reportCtrl.GetSummary)
		protected.GET("/reports/trends", reportCtrl.GetTrends)
		protected.GET("/reports/category-breakdown", reportCtrl.GetCategoryBreakdown)
		protected.GET("/reports/budget-analysis", reportCtrl.GetBudgetAnalysis)

		// File operations
		protected.POST("/upload/receipt", fileCtrl.UploadReceipt)
		protected.POST("/import/csv", fileCtrl.ImportCSV)
		protected.GET("/export/csv", fileCtrl.ExportCSV)
	}

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		utils.Info("Health check endpoint called")
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Service is healthy",
		})
	})

	// Add profiling endpoints if enabled
	if cfg.Performance.EnableProfiling {
		// Add pprof endpoints
		// This would require importing net/http/pprof
		// and adding the endpoints
	}

	return r
}
