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

func (r *TransactionRepository) Update(transaction *models.Transaction) error {
    return r.db.Save(transaction).Error
}

func (r *TransactionRepository) Delete(id, userID uint) error {
    return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Transaction{}).Error
}

func (r *TransactionRepository) FindByID(id, userID uint) (*models.Transaction, error) {
    var transaction models.Transaction
    result := r.db.Where("id = ? AND user_id = ?", id, userID).First(&transaction)
    return &transaction, result.Error
}

func (r *TransactionRepository) FindByIDWithRelations(id, userID uint) (*models.Transaction, error) {
    var transaction models.Transaction
    result := r.db.Where("id = ? AND user_id = ?", id, userID).
        Preload("Category").
        Preload("Tags").
        First(&transaction)
    return &transaction, result.Error
}

func (r *TransactionRepository) FindByUserID(userID uint, limit, offset int, startDate, endDate *time.Time, categoryID *uint) ([]models.Transaction, error) {
    var transactions []models.Transaction
    query := r.db.Where("user_id = ?", userID)

    if startDate != nil {
        query = query.Where("date >= ?", *startDate)
    }
    if endDate != nil {
        query = query.Where("date <= ?", *endDate)
    }
    if categoryID != nil {
        query = query.Where("category_id = ?", *categoryID)
    }

    result := query.Limit(limit).Offset(offset).Order("date DESC").Find(&transactions)
    return transactions, result.Error
}

func (r *TransactionRepository) FindByUserIDWithRelations(userID uint, limit, offset int, startDate, endDate *time.Time, categoryID *uint) ([]models.Transaction, error) {
    var transactions []models.Transaction
    query := r.db.Where("user_id = ?", userID)

    if startDate != nil {
        query = query.Where("date >= ?", *startDate)
    }
    if endDate != nil {
        query = query.Where("date <= ?", *endDate)
    }
    if categoryID != nil {
        query = query.Where("category_id = ?", *categoryID)
    }

    result := query.Preload("Category").Preload("Tags").
        Limit(limit).Offset(offset).Order("date DESC").
        Find(&transactions)
    return transactions, result.Error
}

func (r *TransactionRepository) AssociateTags(transactionID uint, tags []models.Tag) error {
    transaction := models.Transaction{ID: transactionID}
    return r.db.Model(&transaction).Association("Tags").Replace(&tags)
}

func (r *TransactionRepository) ClearTags(transactionID uint) error {
    transaction := models.Transaction{ID: transactionID}
    return r.db.Model(&transaction).Association("Tags").Clear()
}

// Add this method for the report service
func (r *TransactionRepository) GetSummaryByPeriod(userID uint, startDate, endDate time.Time) (map[string]float64, error) {
    type Result struct {
        CategoryName string  `json:"category_name"`
        TotalAmount  float64 `json:"total_amount"`
    }

    var results []Result
    summary := make(map[string]float64)

    // Query to get total amount by category for the period
    err := r.db.Table("transactions").
        Select("categories.name as category_name, SUM(transactions.amount) as total_amount").
        Joins("JOIN categories ON transactions.category_id = categories.id").
        Where("transactions.user_id = ? AND transactions.date BETWEEN ? AND ?", userID, startDate, endDate).
        Group("categories.name").
        Scan(&results).Error

    if err != nil {
        return nil, err
    }

    // Convert results to a map
    for _, result := range results {
        summary[result.CategoryName] = result.TotalAmount
    }

    return summary, nil
}