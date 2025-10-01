package middleware

import (
	"time"

	"github.com/gin-gonic/gin"

	"expense-tracker/internal/utils"
)

var bufferPool = utils.NewBufferPool()

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		end := time.Now()
		latency := end.Sub(start)

		statusCode := c.Writer.Status()

		clientIP := c.ClientIP()

		method := c.Request.Method

		if raw != "" {
			path = path + "?" + raw
		}

		errorMessage := c.Errors.ByType(gin.ErrorTypePrivate).String()

		buf := bufferPool.Get()
		defer bufferPool.Put(buf)

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
