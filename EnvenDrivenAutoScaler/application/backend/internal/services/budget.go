package services

import (
    "time"

    "expense-tracker/internal/models"
    "expense-tracker/internal/repositories"
)

type CreateBudgetRequest struct {
    CategoryID *uint     `json:"category_id"` // Pointer to allow nil values (for overall budget)
    Amount     float64   `json:"amount"`
    Currency   string    `json:"currency"`
    Period     string    `json:"period"`      // "weekly", "monthly", "yearly"
    StartDate  time.Time `json:"start_date"`
    EndDate    *time.Time `json:"end_date"`   // Optional end date
}

type BudgetService struct {
    budgetRepo *repositories.BudgetRepository
}

func NewBudgetService(budgetRepo *repositories.BudgetRepository) *BudgetService {
    return &BudgetService{budgetRepo: budgetRepo}
}

func (s *BudgetService) GetBudgets(userID uint) ([]models.Budget, error) {
    return s.budgetRepo.FindByUserID(userID)
}

func (s *BudgetService) CreateBudget(userID uint, req *CreateBudgetRequest) (*models.Budget, error) {
    // Convert string period to models.BudgetPeriod
    period := models.BudgetPeriod(req.Period)
    
    // Convert pointer EndDate to value (handle nil case)
    var endDate time.Time
    if req.EndDate != nil {
        endDate = *req.EndDate
    }

    budget := &models.Budget{
        UserID:     userID,
        CategoryID: req.CategoryID,
        Amount:     req.Amount,
        Currency:   req.Currency,
        Period:     period,
        StartDate:  req.StartDate,
        EndDate:    endDate,
        IsActive:   true,
    }

    if err := s.budgetRepo.Create(budget); err != nil {
        return nil, err
    }

    return s.budgetRepo.FindByID(budget.ID, userID)
}

func (s *BudgetService) UpdateBudget(id, userID uint, req *CreateBudgetRequest) (*models.Budget, error) {
    budget, err := s.budgetRepo.FindByID(id, userID)
    if err != nil {
        return nil, err
    }

    // Convert string period to models.BudgetPeriod
    period := models.BudgetPeriod(req.Period)
    
    // Convert pointer EndDate to value (handle nil case)
    var endDate time.Time
    if req.EndDate != nil {
        endDate = *req.EndDate
    }

    budget.CategoryID = req.CategoryID
    budget.Amount = req.Amount
    budget.Currency = req.Currency
    budget.Period = period
    budget.StartDate = req.StartDate
    budget.EndDate = endDate

    if err := s.budgetRepo.Update(budget); err != nil {
        return nil, err
    }

    return budget, nil
}

func (s *BudgetService) DeleteBudget(id, userID uint) error {
    return s.budgetRepo.Delete(id, userID)
}