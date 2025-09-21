package repositories

import (
	"fmt"

	"gorm.io/gorm"

	"expense-tracker/internal/models"
)

type BudgetRepository struct {
	db *gorm.DB
}

func NewBudgetRepository(db *gorm.DB) *BudgetRepository {
	return &BudgetRepository{db: db}
}

func (r *BudgetRepository) Create(budget *models.Budget) error {
	return r.db.Create(budget).Error
}

func (r *BudgetRepository) FindByID(id, userID uint) (*models.Budget, error) {
	var budget models.Budget
	err := r.db.Preload("Category").Where("id = ? AND user_id = ?", id, userID).First(&budget).Error
	return &budget, err
}

func (r *BudgetRepository) FindByUserID(userID uint) ([]models.Budget, error) {
	var budgets []models.Budget

	// Get the system user ID for default budgets
	var systemUser models.User
	r.db.Where("email = ?", "system@expensetracker.local").First(&systemUser)

	// Query for budgets that belong to either the current user or the system user
	err := r.db.Preload("Category").Where("user_id = ? OR user_id = ?", userID, systemUser.ID).Find(&budgets).Error

	fmt.Printf("DEBUG: Querying budgets for user ID: %d and system user ID: %d\n", userID, systemUser.ID)
	fmt.Printf("DEBUG: Found %d budgets\n", len(budgets))

	return budgets, err
}

func (r *BudgetRepository) Update(budget *models.Budget) error {
	return r.db.Save(budget).Error
}

func (r *BudgetRepository) Delete(id, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Budget{}).Error
}
