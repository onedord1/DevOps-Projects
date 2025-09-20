package main

import (
    "log"

    "github.com/gin-gonic/gin"

    "expense-tracker/internal/config"
    "expense-tracker/internal/controllers"
    "expense-tracker/internal/database"
    "expense-tracker/internal/middleware"
    "expense-tracker/internal/repositories"
    "expense-tracker/internal/services"
)

func main() {
    // Load configuration
    cfg, err := config.Load()
    if err != nil {
        log.Fatal("Failed to load config:", err)
    }

    // Connect to database
    db, err := database.Connect(cfg)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    // Run migrations
    if err := database.RunMigrations(db, cfg); err != nil {
        log.Fatal("Failed to run migrations:", err)
    }

    // Initialize repositories
    userRepo := repositories.NewUserRepository(db)
    transactionRepo := repositories.NewTransactionRepository(db)
    categoryRepo := repositories.NewCategoryRepository(db)
    budgetRepo := repositories.NewBudgetRepository(db)
    tagRepo := repositories.NewTagRepository(db)

    // Initialize services
    authService := services.NewAuthService(userRepo, cfg)
    expenseService := services.NewExpenseService(transactionRepo, categoryRepo, tagRepo) // Updated
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

    // Start server
    log.Printf("Starting server on port %s", cfg.Server.Port)
    if err := r.Run(":" + cfg.Server.Port); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}

func setupRoutes(cfg *config.Config, authCtrl *controllers.AuthController,
    expenseCtrl *controllers.ExpenseController,
    categoryCtrl *controllers.CategoryController,
    budgetCtrl *controllers.BudgetController,
    reportCtrl *controllers.ReportController,
    fileCtrl *controllers.FileController,
    tagCtrl *controllers.TagController) *gin.Engine {

    r := gin.Default()

    // Middleware
    r.Use(middleware.CORS())
    r.Use(middleware.Logger())

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

    return r
}