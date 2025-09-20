package services

import (
    "expense-tracker/internal/models"
    "expense-tracker/internal/repositories"
)

type CreateCategoryRequest struct {
    Name  string `json:"name" validate:"required,min=1,max=100"`
    Type  string `json:"type" validate:"required,oneof=expense income"`
    Color string `json:"color" validate:"required,min=3,max=7"` // e.g., "#FF5733"
    Icon  string `json:"icon" validate:"required,min=1,max=50"`  // e.g., "shopping-cart"
}

type CategoryService struct {
    categoryRepo *repositories.CategoryRepository
}

func NewCategoryService(categoryRepo *repositories.CategoryRepository) *CategoryService {
    return &CategoryService{categoryRepo: categoryRepo}
}

func (s *CategoryService) GetCategories(userID uint) ([]models.Category, error) {
    return s.categoryRepo.FindByUserID(userID)
}

func (s *CategoryService) CreateCategory(userID uint, req *CreateCategoryRequest) (*models.Category, error) {
    // Convert string to models.CategoryType
    categoryType := models.CategoryType(req.Type)

    category := &models.Category{
        UserID: userID,
        Name:   req.Name,
        Type:   categoryType,
        Color:  req.Color,
        Icon:   req.Icon,
    }

    if err := s.categoryRepo.Create(category); err != nil {
        return nil, err
    }

    return category, nil
}

func (s *CategoryService) UpdateCategory(id, userID uint, req *CreateCategoryRequest) (*models.Category, error) {
    category, err := s.categoryRepo.FindByID(id, userID)
    if err != nil {
        return nil, err
    }

    // Convert string to models.CategoryType
    categoryType := models.CategoryType(req.Type)

    category.Name = req.Name
    category.Type = categoryType
    category.Color = req.Color
    category.Icon = req.Icon

    if err := s.categoryRepo.Update(category); err != nil {
        return nil, err
    }

    return category, nil
}

func (s *CategoryService) DeleteCategory(id, userID uint) error {
    return s.categoryRepo.Delete(id, userID)
}