package services

import (
	"errors"
	"fmt"
	"time"
	"strings"

	"expense-tracker/internal/config"
	"expense-tracker/internal/models"
	"expense-tracker/internal/repositories"
	"expense-tracker/internal/utils"
)

type AuthService struct {
	userRepo *repositories.UserRepository
	config   *config.Config
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type SignupRequest struct {
	Name     string `json:"name" validate:"required,min=2"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

func NewAuthService(userRepo *repositories.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		config:   cfg,
	}
}

func (s *AuthService) SignUp(req *SignupRequest) (*AuthResponse, error) {
    existingUser, err := s.userRepo.FindByEmail(req.Email)
    if err != nil {
        return nil, err
    }
    if existingUser != nil {
        return nil, errors.New("user already exists with this email")
    }

    user := &models.User{
        Name:  req.Name,
        Email: req.Email,
        Role:  models.RoleBasic,
    }

    if err := user.SetPassword(req.Password); err != nil {
        return nil, err
    }

    if err := s.userRepo.Create(user); err != nil {
        if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
            return nil, errors.New("user already exists with this email")
        }
        return nil, err
    }

    token, err := utils.GenerateJWT(user.ID, s.config.JWT.Secret, time.Duration(s.config.JWT.ExpiryDays)*24*time.Hour)
    if err != nil {
        return nil, err
    }

    return &AuthResponse{
        Token: token,
        User:  user,
    }, nil
}

func (s *AuthService) Login(req *LoginRequest) (*AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !user.CheckPassword(req.Password) {
		return nil, errors.New("invalid credentials")
	}

	token, err := utils.GenerateJWT(user.ID, s.config.JWT.Secret, time.Duration(s.config.JWT.ExpiryDays)*24*time.Hour)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

func (s *AuthService) GetUserProfile(userID uint) (*models.User, error) {
	return s.userRepo.FindByID(userID)
}

type UpdateProfileRequest struct {
	Name  string `json:"name" validate:"required,min=2"`
	Email string `json:"email" validate:"required,email"`
}

func (s *AuthService) UpdateProfile(userID uint, req *UpdateProfileRequest) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	if user.Email != req.Email {
		existingUser, _ := s.userRepo.FindByEmail(req.Email)
		if existingUser != nil && existingUser.ID != userID {
			return nil, errors.New("email already taken by another user")
		}
	}

	user.Name = req.Name
	user.Email = req.Email

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) ForgotPassword(email string) error {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return nil
	}

	resetToken, err := utils.GenerateJWT(user.ID, s.config.JWT.Secret, time.Hour)
	if err != nil {
		return err
	}

	fmt.Printf("Reset token for user %d: %s\n", user.ID, resetToken)
	return nil
}

func (s *AuthService) ResetPassword(token, newPassword string) error {
	userID, err := utils.ValidateJWT(token, s.config.JWT.Secret)
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}

	if err := user.SetPassword(newPassword); err != nil {
		return err
	}

	return s.userRepo.Update(user)
}
