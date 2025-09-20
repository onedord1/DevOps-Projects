package services

import (
    "time"

    "expense-tracker/internal/repositories"
)

type ReportService struct {
    transactionRepo *repositories.TransactionRepository
    budgetRepo      *repositories.BudgetRepository
}

type SummaryData struct {
    TotalExpenses float64            `json:"total_expenses"`
    TotalIncome   float64            `json:"total_income"`
    NetAmount     float64            `json:"net_amount"`
    Categories    map[string]float64 `json:"categories"`
}

type TrendData struct {
    Period string  `json:"period"`
    Amount float64 `json:"amount"`
}

func NewReportService(transactionRepo *repositories.TransactionRepository, budgetRepo *repositories.BudgetRepository) *ReportService {
    return &ReportService{
        transactionRepo: transactionRepo,
        budgetRepo:      budgetRepo,
    }
}

func (s *ReportService) GetSummary(userID uint, startDate, endDate time.Time) (*SummaryData, error) {
    summary, err := s.transactionRepo.GetSummaryByPeriod(userID, startDate, endDate)
    if err != nil {
        return nil, err
    }

    var totalExpenses, totalIncome float64
    // Fixed: Changed 'category' to blank identifier since it's not used
    for _, amount := range summary {
        if amount > 0 {
            totalIncome += amount
        } else {
            totalExpenses += -amount // Convert to positive for display
        }
    }

    return &SummaryData{
        TotalExpenses: totalExpenses,
        TotalIncome:   totalIncome,
        NetAmount:     totalIncome - totalExpenses,
        Categories:    summary,
    }, nil
}

func (s *ReportService) GetTrends(userID uint, period string, months int) ([]TrendData, error) {
    // Implementation would depend on specific requirements
    // This is a simplified version
    var trends []TrendData
    now := time.Now()
    
    for i := 0; i < months; i++ {
        startDate := now.AddDate(0, -i-1, 0).Truncate(24 * time.Hour)
        endDate := now.AddDate(0, -i, 0).Truncate(24 * time.Hour)
        
        summary, err := s.transactionRepo.GetSummaryByPeriod(userID, startDate, endDate)
        if err != nil {
            continue
        }
        
        var total float64
        for _, amount := range summary {
            total += amount
        }
        
        trends = append(trends, TrendData{
            Period: startDate.Format("2006-01"),
            Amount: total,
        })
    }
    
    return trends, nil
}

func (s *ReportService) GetCategoryBreakdown(userID uint, startDate, endDate time.Time) (map[string]float64, error) {
    return s.transactionRepo.GetSummaryByPeriod(userID, startDate, endDate)
}

type BudgetAnalysisData struct {
    CategoryName    string  `json:"category_name"`
    BudgetAmount    float64 `json:"budget_amount"`
    SpentAmount     float64 `json:"spent_amount"`
    RemainingAmount float64 `json:"remaining_amount"`
    PercentageUsed  float64 `json:"percentage_used"`
    Status          string  `json:"status"` // "under", "near", "over"
}

func (s *ReportService) GetBudgetAnalysis(userID uint) ([]BudgetAnalysisData, error) {
    budgets, err := s.budgetRepo.FindByUserID(userID)
    if err != nil {
        return nil, err
    }

    var analysis []BudgetAnalysisData
    now := time.Now()

    for _, budget := range budgets {
        if !budget.IsActive || now.After(budget.EndDate) {
            continue
        }

        // Calculate spent amount for this budget period
        var spentAmount float64
        if budget.CategoryID != nil {
            // Category-specific budget
            transactions, _ := s.transactionRepo.FindByUserID(userID, 1000, 0, &budget.StartDate, &budget.EndDate, budget.CategoryID)
            for _, transaction := range transactions {
                spentAmount += transaction.Amount
            }
        } else {
            // Overall budget
            summary, _ := s.transactionRepo.GetSummaryByPeriod(userID, budget.StartDate, budget.EndDate)
            for _, amount := range summary {
                if amount < 0 { // Only count expenses
                    spentAmount += -amount
                }
            }
        }

        remaining := budget.Amount - spentAmount
        percentage := (spentAmount / budget.Amount) * 100

        status := "under"
        if percentage >= 100 {
            status = "over"
        } else if percentage >= 80 {
            status = "near"
        }

        categoryName := "Overall"
        if budget.Category != nil {
            categoryName = budget.Category.Name
        }

        analysis = append(analysis, BudgetAnalysisData{
            CategoryName:    categoryName,
            BudgetAmount:    budget.Amount,
            SpentAmount:     spentAmount,
            RemainingAmount: remaining,
            PercentageUsed:  percentage,
            Status:          status,
        })
    }

    return analysis, nil
}