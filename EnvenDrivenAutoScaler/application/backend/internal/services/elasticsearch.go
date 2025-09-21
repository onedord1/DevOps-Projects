package services

import (
	"fmt"

	"expense-tracker/internal/config"
)

// ElasticsearchService is a placeholder for now
// You can implement the full version later
type ElasticsearchService struct{}

func NewElasticsearchService(cfg *config.Config) (*ElasticsearchService, error) {
	// Placeholder implementation
	// In a real implementation, you would initialize the Elasticsearch client here
	fmt.Println("Elasticsearch service initialized (placeholder)")
	return &ElasticsearchService{}, nil
}
