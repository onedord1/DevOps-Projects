package repositories

import (
	"errors"

	"gorm.io/gorm"

	"expense-tracker/internal/models"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	result := r.db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil instead of an error when record not found
		}
		return nil, result.Error
	}
	return &user, nil
}

func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}
