package repositories

import (
	"fmt"

	"gorm.io/gorm"

	"expense-tracker/internal/models"
)

type CategoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) Create(category *models.Category) error {
	return r.db.Create(category).Error
}

func (r *CategoryRepository) FindByID(id, userID uint) (*models.Category, error) {
    var category models.Category
    
  
    var systemUser models.User
    r.db.Where("email = ?", "system@expensetracker.local").First(&systemUser)
    
    err := r.db.Where("id = ? AND (user_id = ? OR user_id = ?)", id, userID, systemUser.ID).First(&category).Error
    return &category, err
}

func (r *CategoryRepository) FindByUserID(userID uint) ([]models.Category, error) {
	var categories []models.Category

	var systemUser models.User
	r.db.Where("email = ?", "system@expensetracker.local").First(&systemUser)

	err := r.db.Where("user_id = ? OR user_id = ?", userID, systemUser.ID).Find(&categories).Error

	fmt.Printf("DEBUG: Querying for user ID: %d and system user ID: %d\n", userID, systemUser.ID)
	fmt.Printf("DEBUG: Found %d categories\n", len(categories))

	return categories, err
}

func (r *CategoryRepository) Update(category *models.Category) error {
	return r.db.Save(category).Error
}

func (r *CategoryRepository) Delete(id, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Category{}).Error
}
