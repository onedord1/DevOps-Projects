package services

import (
	"errors"
	"fmt"
	"strconv"
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
	Tags        []string  `json:"tags"`        // Optional tag IDs
}

type ExpenseService struct {
	transactionRepo *repositories.TransactionRepository
	categoryRepo    *repositories.CategoryRepository
	tagRepo         *repositories.TagRepository // Add this
}

func NewExpenseService(transactionRepo *repositories.TransactionRepository, categoryRepo *repositories.CategoryRepository, tagRepo *repositories.TagRepository) *ExpenseService {
	return &ExpenseService{
		transactionRepo: transactionRepo,
		categoryRepo:    categoryRepo,
		tagRepo:         tagRepo,
	}
}

func (s *ExpenseService) CreateExpense(userID uint, req *CreateExpenseRequest) (*models.Transaction, error) {
	// Verify category belongs to user
	_, err := s.categoryRepo.FindByID(req.CategoryID, userID)
	if err != nil {
		return nil, errors.New("category not found")
	}

	// Convert ReceiptURL pointer to string
	var receiptURL string
	if req.ReceiptURL != nil {
		receiptURL = *req.ReceiptURL
	}

	// Create transaction without tags first
	transaction := &models.Transaction{
		UserID:      userID,
		CategoryID:  req.CategoryID,
		Amount:      req.Amount,
		Currency:    req.Currency,
		Date:        req.Date,
		Description: req.Description,
		ReceiptURL:  receiptURL,
	}

	if err := s.transactionRepo.Create(transaction); err != nil {
		return nil, err
	}

	// If there are tag IDs, associate them with the transaction
	if len(req.Tags) > 0 {
		// Convert string IDs to uint
		var tagIDs []uint
		for _, tagStr := range req.Tags {
			if tagStr != "" {
				tagID, err := strconv.ParseUint(tagStr, 10, 32)
				if err != nil {
					return nil, errors.New("invalid tag ID: " + tagStr)
				}
				tagIDs = append(tagIDs, uint(tagID))
			}
		}

		// Find tags by IDs
		var tags []models.Tag
		if err := s.tagRepo.FindByIDs(tagIDs).Find(&tags).Error; err != nil {
			return nil, errors.New("failed to find tags")
		}
		fmt.Println("tags======================", tags)

		// Associate tags with transaction
		if err := s.transactionRepo.AssociateTags(transaction.ID, tags); err != nil {
			fmt.Println("::::::::::::::::::::::")
			return nil, errors.New("failed to associate tags with transaction")
		}
	}

	// Fetch the complete transaction with preloaded relations
	result, err := s.transactionRepo.FindByIDWithRelations(transaction.ID, userID)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (s *ExpenseService) GetExpenses(userID uint, page, limit int, startDate, endDate *time.Time, categoryID *uint) ([]models.Transaction, error) {
	offset := (page - 1) * limit
	return s.transactionRepo.FindByUserIDWithRelations(userID, limit, offset, startDate, endDate, categoryID)
}

func (s *ExpenseService) GetExpense(id, userID uint) (*models.Transaction, error) {
	return s.transactionRepo.FindByIDWithRelations(id, userID)
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

	// Update transaction fields
	transaction.CategoryID = req.CategoryID
	transaction.Amount = req.Amount
	transaction.Currency = req.Currency
	transaction.Date = req.Date
	transaction.Description = req.Description
	transaction.ReceiptURL = receiptURL

	// Update transaction
	if err := s.transactionRepo.Update(transaction); err != nil {
		return nil, err
	}

	// Update tag associations
	if len(req.Tags) > 0 {
		// Convert string IDs to uint
		var tagIDs []uint
		for _, tagStr := range req.Tags {
			if tagStr != "" {
				tagID, err := strconv.ParseUint(tagStr, 10, 32)
				if err != nil {
					return nil, errors.New("invalid tag ID: " + tagStr)
				}
				tagIDs = append(tagIDs, uint(tagID))
			}
		}

		// Find tags by IDs
		var tags []models.Tag
		if err := s.tagRepo.FindByIDs(tagIDs).Error; err != nil {
			return nil, errors.New("failed to find tags")
		}

		// Replace tag associations
		if err := s.transactionRepo.AssociateTags(transaction.ID, tags); err != nil {
			return nil, errors.New("failed to associate tags with transaction")
		}
	} else {
		// Clear all tag associations
		if err := s.transactionRepo.ClearTags(transaction.ID); err != nil {
			return nil, errors.New("failed to clear tags")
		}
	}

	// Fetch the complete transaction with preloaded relations
	result, err := s.transactionRepo.FindByIDWithRelations(id, userID)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (s *ExpenseService) DeleteExpense(id, userID uint) error {
	return s.transactionRepo.Delete(id, userID)
}
