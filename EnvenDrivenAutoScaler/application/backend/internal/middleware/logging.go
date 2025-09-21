package middleware

import (
	"time"

	"github.com/gin-gonic/gin"

	"expense-tracker/internal/utils"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start timer
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Stop timer
		end := time.Now()
		latency := end.Sub(start)

		// Get status code
		statusCode := c.Writer.Status()

		// Get client IP
		clientIP := c.ClientIP()

		// Get method
		method := c.Request.Method

		// Get path with query parameters
		if raw != "" {
			path = path + "?" + raw
		}

		// Get error message if any
		errorMessage := c.Errors.ByType(gin.ErrorTypePrivate).String()

		// Log with different levels based on status code
		if statusCode >= 500 {
			utils.Err("HTTP request",
				utils.String("method", method),
				utils.String("path", path),
				utils.Int("status", statusCode),
				utils.String("client_ip", clientIP),
				utils.String("latency", latency.String()),
				utils.String("error", errorMessage),
			)
		} else if statusCode >= 400 {
			utils.Warn("HTTP request",
				utils.String("method", method),
				utils.String("path", path),
				utils.Int("status", statusCode),
				utils.String("client_ip", clientIP),
				utils.String("latency", latency.String()),
				utils.String("error", errorMessage),
			)
		} else {
			utils.Info("HTTP request",
				utils.String("method", method),
				utils.String("path", path),
				utils.Int("status", statusCode),
				utils.String("client_ip", clientIP),
				utils.String("latency", latency.String()),
			)
		}
	}
}
