package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/quiz-hosting-app/backend/config"
	"github.com/quiz-hosting-app/backend/handlers"
	"github.com/quiz-hosting-app/backend/middleware"
	"github.com/quiz-hosting-app/backend/models"
	"github.com/rs/cors"
)

// SetupRouter configures all routes
func SetupRouter(cfg *config.Config) http.Handler {
	r := mux.NewRouter()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg)
	subjectHandler := handlers.NewSubjectHandler()
	quizHandler := handlers.NewQuizHandler()
	questionHandler := handlers.NewQuestionHandler()
	attemptHandler := handlers.NewAttemptHandler()
	sessionHandler := handlers.NewSessionHandler()
	studentHandler := handlers.NewStudentHandler()

	// API prefix
	api := r.PathPrefix("/api").Subrouter()

	// Public routes (no authentication required)
	api.HandleFunc("/auth/register", authHandler.Register).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST", "OPTIONS")

	// Protected routes (authentication required)
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.AuthMiddleware(cfg.JWT.Secret))

	// Auth routes
	protected.HandleFunc("/auth/me", authHandler.GetMe).Methods("GET", "OPTIONS")
	protected.HandleFunc("/auth/profile", authHandler.UpdateProfile).Methods("PUT", "OPTIONS")
	protected.HandleFunc("/auth/password", authHandler.UpdatePassword).Methods("PUT", "OPTIONS")

	// Subject routes (accessible to all authenticated users)
	protected.HandleFunc("/subjects", subjectHandler.GetSubjects).Methods("GET", "OPTIONS")
	protected.HandleFunc("/subjects/{id}", subjectHandler.GetSubject).Methods("GET", "OPTIONS")
	protected.HandleFunc("/subjects/{subjectId}/quizzes", quizHandler.GetQuizzesBySubject).Methods("GET", "OPTIONS")

	// Quiz routes (accessible to all authenticated users)
	protected.HandleFunc("/quizzes/{id}", quizHandler.GetQuiz).Methods("GET", "OPTIONS")
	protected.HandleFunc("/quizzes/{id}/questions", quizHandler.GetQuizQuestions).Methods("GET", "OPTIONS")

	// Quiz attempt routes (students)
	protected.HandleFunc("/quizzes/{id}/attempts", attemptHandler.StartAttempt).Methods("POST", "OPTIONS")
	protected.HandleFunc("/attempts/{id}", attemptHandler.GetAttempt).Methods("GET", "OPTIONS")
	protected.HandleFunc("/attempts/{id}/answer", attemptHandler.SubmitAnswer).Methods("POST", "OPTIONS")
	protected.HandleFunc("/attempts/{id}/submit", attemptHandler.SubmitAttempt).Methods("POST", "OPTIONS")
	protected.HandleFunc("/attempts/{id}/result", attemptHandler.GetAttemptResult).Methods("GET", "OPTIONS")
	protected.HandleFunc("/my-attempts", attemptHandler.GetMyAttempts).Methods("GET", "OPTIONS")

	// Admin routes
	admin := protected.PathPrefix("/admin").Subrouter()
	admin.Use(middleware.RequireRole(models.RoleAdmin))

	// Admin - Subject management
	admin.HandleFunc("/subjects", subjectHandler.CreateSubject).Methods("POST", "OPTIONS")
	admin.HandleFunc("/subjects/{id}", subjectHandler.UpdateSubject).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/subjects/{id}", subjectHandler.DeleteSubject).Methods("DELETE", "OPTIONS")

	// Admin - Quiz management
	admin.HandleFunc("/quizzes", quizHandler.CreateQuiz).Methods("POST", "OPTIONS")
	admin.HandleFunc("/quizzes/{id}", quizHandler.UpdateQuiz).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/quizzes/{id}", quizHandler.DeleteQuiz).Methods("DELETE", "OPTIONS")

	// Admin - Question management
	admin.HandleFunc("/questions", questionHandler.CreateQuestion).Methods("POST", "OPTIONS")
	admin.HandleFunc("/questions/{id}", questionHandler.GetQuestion).Methods("GET", "OPTIONS")
	admin.HandleFunc("/questions/{id}", questionHandler.UpdateQuestion).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/questions/{id}", questionHandler.DeleteQuestion).Methods("DELETE", "OPTIONS")

	// Admin - Attempts management
	admin.HandleFunc("/attempts", attemptHandler.GetAllAttempts).Methods("GET", "OPTIONS")

	// Admin - Student management
	admin.HandleFunc("/students", studentHandler.GetAllStudents).Methods("GET", "OPTIONS")
	admin.HandleFunc("/students/stats", studentHandler.GetStudentStats).Methods("GET", "OPTIONS")
	admin.HandleFunc("/students/{id}", studentHandler.GetStudentByID).Methods("GET", "OPTIONS")
	admin.HandleFunc("/students/{id}/approve", studentHandler.ApproveStudent).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/students/{id}/reject", studentHandler.RejectStudent).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/students/{id}/revoke-rejection", studentHandler.RevokeRejection).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/students/{id}/password", studentHandler.UpdateStudentPassword).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/students/{id}", studentHandler.DeleteStudent).Methods("DELETE", "OPTIONS")
	admin.HandleFunc("/quizzes/{quizId}/sessions", sessionHandler.CreateSession).Methods("POST", "OPTIONS")
	admin.HandleFunc("/quizzes/{quizId}/sessions", sessionHandler.GetSessionsByQuiz).Methods("GET", "OPTIONS")
	admin.HandleFunc("/sessions/{id}", sessionHandler.GetSession).Methods("GET", "OPTIONS")
	admin.HandleFunc("/sessions/{id}", sessionHandler.UpdateSession).Methods("PUT", "OPTIONS")
	admin.HandleFunc("/sessions/{id}", sessionHandler.DeleteSession).Methods("DELETE", "OPTIONS")

	// Student - Session routes
	protected.HandleFunc("/sessions/available", sessionHandler.GetAvailableSessions).Methods("GET", "OPTIONS")
	protected.HandleFunc("/subjects/{subjectId}/sessions", sessionHandler.GetSessionsBySubject).Methods("GET", "OPTIONS")
	protected.HandleFunc("/sessions/{id}", sessionHandler.GetSession).Methods("GET", "OPTIONS")

	// Health check
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}).Methods("GET")

	// Temporary debug endpoint to hash passwords
	r.HandleFunc("/debug/hash-password", func(w http.ResponseWriter, r *http.Request) {
		password := r.URL.Query().Get("password")
		if password == "" {
			http.Error(w, "password query parameter required", http.StatusBadRequest)
			return
		}
		
		user := &models.User{}
		if err := user.HashPassword(password); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"password":"` + password + `","hash":"` + user.PasswordHash + `"}`))
	}).Methods("GET")

	// Apply logging middleware
	r.Use(middleware.LoggingMiddleware)

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   cfg.CORS.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           300,
	})

	return c.Handler(r)
}
