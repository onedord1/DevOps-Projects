package utils

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

type SuccessResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

// RespondJSON sends JSON response
func RespondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

// RespondError sends error response
func RespondError(w http.ResponseWriter, statusCode int, message string) {
	RespondJSON(w, statusCode, ErrorResponse{
		Error:   http.StatusText(statusCode),
		Message: message,
	})
}

// RespondSuccess sends success response
func RespondSuccess(w http.ResponseWriter, statusCode int, data interface{}, message string) {
	response := SuccessResponse{
		Data:    data,
		Message: message,
	}
	RespondJSON(w, statusCode, response)
}
