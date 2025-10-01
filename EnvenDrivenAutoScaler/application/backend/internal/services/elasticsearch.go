package services

import (
	"fmt"

	"expense-tracker/internal/config"
)

type ElasticsearchService struct{}

func NewElasticsearchService(cfg *config.Config) (*ElasticsearchService, error) {
	fmt.Println("Elasticsearch service initialized (placeholder)")
	return &ElasticsearchService{}, nil
}
