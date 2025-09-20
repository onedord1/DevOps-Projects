package services

import (
    "errors"
    "strings"
    "time"

    "expense-tracker/internal/models"
    "expense-tracker/internal/repositories"
)

type CreateExpenseRequest struct {
    CategoryID  uint      `json:"category_id" validate:"required"`
    Amount      float64   `json:"amount" validate:"required,gt=0"`
    Currency    string    `json:"currency" validate:"required,len=3"`
    Date        time.Time `json:"date" validate:"required"`
    Description string    `json:"description" validate:"max=500"`
    ReceiptURL  *string   `json:"receipt_url"` // Optional receipt URL
    Tags        []string  `json:"tags"`        // Optional tags
}

type ExpenseService struct {
    transactionRepo *repositories.TransactionRepository
    categoryRepo    *repositories.CategoryRepository
}

func NewExpenseService(transactionRepo *repositories.TransactionRepository, categoryRepo *repositories.CategoryRepository) *ExpenseService {
    return &ExpenseService{
        transactionRepo: transactionRepo,
        categoryRepo:    categoryRepo,
    }
}

func (s *ExpenseService) CreateExpense(userID uint, req *CreateExpenseRequest) (*models.Transaction, error) {
    // Verify category belongs to user
    category, err := s.categoryRepo.FindByID(req.CategoryID, userID)
    if err != nil {
        return nil, errors.New("category not found")
    }

    // Convert ReceiptURL pointer to string
    var receiptURL string
    if req.ReceiptURL != nil {
        receiptURL = *req.ReceiptURL
    }

    // Convert Tags slice to comma-separated string
    tagsStr := strings.Join(req.Tags, ",")

    transaction := &models.Transaction{
        UserID:      userID,
        CategoryID:  req.CategoryID,
        Amount:      req.Amount,
        Currency:    req.Currency,
        Date:        req.Date,
        Description: req.Description,
        ReceiptURL:  receiptURL,
        Tags:        tagsStr,
    }

    if err := s.transactionRepo.Create(transaction); err != nil {
        return nil, err
    }

    transaction.Category = *category
    return transaction, nil
}

func (s *ExpenseService) GetExpenses(userID uint, page, limit int, startDate, endDate *time.Time, categoryID *uint) ([]models.Transaction, error) {
    offset := (page - 1) * limit
    return s.transactionRepo.FindByUserID(userID, limit, offset, startDate, endDate, categoryID)
}

func (s *ExpenseService) GetExpense(id, userID uint) (*models.Transaction, error) {
    return s.transactionRepo.FindByID(id, userID)
}

func (s *ExpenseService) UpdateExpense(id, userID uint, req *CreateExpenseRequest) (*models.Transaction, error) {
    transaction, err := s.transactionRepo.FindByID(id, userID)
    if err != nil {
        return nil, err
    }

    // Verify new category belongs to user
    if req.CategoryID != transaction.CategoryID {
        _, err := s.categoryRepo.FindByID(req.CategoryID, userID)
        if err != nil {
            return nil, errors.New("category not found")
        }
    }

    // Convert ReceiptURL pointer to string
    var receiptURL string
    if req.ReceiptURL != nil {
        receiptURL = *req.ReceiptURL
    }

    // Convert Tags slice to comma-separated string
    tagsStr := strings.Join(req.Tags, ",")

    transaction.CategoryID = req.CategoryID
    transaction.Amount = req.Amount
    transaction.Currency = req.Currency
    transaction.Date = req.Date
    transaction.Description = req.Description
    transaction.ReceiptURL = receiptURL
    transaction.Tags = tagsStr

    if err := s.transactionRepo.Update(transaction); err != nil {
        return nil, err
    }

    return s.transactionRepo.FindByID(id, userID)
}

func (s *ExpenseService) DeleteExpense(id, userID uint) error {
    return s.transactionRepo.Delete(id, userID)
}