package main

import (
	"fmt"
	"log"
	"github.com/quiz-hosting-app/backend/config"
	"github.com/quiz-hosting-app/backend/database"
	"github.com/quiz-hosting-app/backend/models"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	database.Connect(cfg)

	var questions []models.Question
	database.DB.Preload("Options").Find(&questions)

	fmt.Println("Questions with images:")
	for _, q := range questions {
		if q.ImagePath != nil && *q.ImagePath != "" {
			fmt.Printf("Question ID: %s, Text: %s, ImagePath: '%s'\n", q.ID, q.Text, *q.ImagePath)
		}
	}
}
