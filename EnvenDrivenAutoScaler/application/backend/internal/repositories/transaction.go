package repositories

import (
	"time"

	"gorm.io/gorm"

	"expense-tracker/internal/models"
)

type TransactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) Create(transaction *models.Transaction) error {
	return r.db.Create(transaction).Error
}

func (r *TransactionRepository) FindByID(id, userID uint) (*models.Transaction, error) {
	var transaction models.Transaction
	err := r.db.Preload("Category").Where("id = ? AND user_id = ?", id, userID).First(&transaction).Error
	return &transaction, err
}

func (r *TransactionRepository) FindByUserID(userID uint, limit, offset int, startDate, endDate *time.Time, categoryID *uint) ([]models.Transaction, error) {
	query := r.db.Preload("Category").Where("user_id = ?", userID)

	if startDate != nil {
		query = query.Where("date >= ?", *startDate)
	}
	if endDate != nil {
		query = query.Where("date <= ?", *endDate)
	}
	if categoryID != nil {
		query = query.Where("category_id = ?", *categoryID)
	}

	var transactions []models.Transaction
	err := query.Order("date DESC").Limit(limit).Offset(offset).Find(&transactions).Error
	return transactions, err
}

func (r *TransactionRepository) Update(transaction *models.Transaction) error {
	return r.db.Save(transaction).Error
}

func (r *TransactionRepository) Delete(id, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Transaction{}).Error
}

func (r *TransactionRepository) GetSummaryByPeriod(userID uint, startDate, endDate time.Time) (map[string]float64, error) {
	var results []struct {
		CategoryName string  `json:"category_name"`
		Total        float64 `json:"total"`
	}

	err := r.db.Table("transactions").
		Select("categories.name as category_name, SUM(transactions.amount) as total").
		Joins("LEFT JOIN categories ON categories.id = transactions.category_id").
		Where("transactions.user_id = ? AND transactions.date BETWEEN ? AND ?", userID, startDate, endDate).
		Group("categories.name").
		Find(&results).Error

	if err != nil {
		return nil, err
	}

	summary := make(map[string]float64)
	for _, result := range results {
		summary[result.CategoryName] = result.Total
	}

	return summary, nil
}
