package services

import (
	"fmt"
	"net/smtp"
	"strings"

	"expense-tracker/internal/config"
)

type NotificationService struct {
	config *config.Config
}

func NewNotificationService(cfg *config.Config) *NotificationService {
	return &NotificationService{config: cfg}
}

func (s *NotificationService) SendEmail(to, subject, body string) error {
	if s.config.Email.SMTPHost == "" {
		return fmt.Errorf("email service not configured")
	}

	auth := smtp.PlainAuth("", s.config.Email.SMTPUsername, s.config.Email.SMTPPassword, s.config.Email.SMTPHost)

	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\n\r\n%s", to, subject, body))

	addr := fmt.Sprintf("%s:%s", s.config.Email.SMTPHost, s.config.Email.SMTPPort)

	return smtp.SendMail(addr, auth, s.config.Email.FromEmail, []string{to}, msg)
}

func (s *NotificationService) SendBudgetAlert(userEmail string, categoryName string, spent, budget float64) error {
	percentage := (spent / budget) * 100
	subject := fmt.Sprintf("Budget Alert: %s", categoryName)
	body := fmt.Sprintf(`
Hi,

You have spent %.2f%% of your budget for %s.
Spent: $%.2f
Budget: $%.2f
Remaining: $%.2f

Best regards,
Expense Tracker Team
    `, percentage, categoryName, spent, budget, budget-spent)

	return s.SendEmail(userEmail, subject, strings.TrimSpace(body))
}
