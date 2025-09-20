package services

import (
    "expense-tracker/internal/models"
    "expense-tracker/internal/repositories"
)

type TagService struct {
    tagRepo *repositories.TagRepository
}

func NewTagService(tagRepo *repositories.TagRepository) *TagService {
    return &TagService{tagRepo: tagRepo}
}

func (s *TagService) GetAllTags() ([]models.Tag, error) {
    return s.tagRepo.GetAll()
}

func (s *TagService) GetTagByID(id uint) (*models.Tag, error) {
    return s.tagRepo.GetByID(id)
}

func (s *TagService) CreateTag(tag *models.Tag) error {
    return s.tagRepo.Create(tag)
}

func (s *TagService) UpdateTag(tag *models.Tag) error {
    return s.tagRepo.Update(tag)
}

func (s *TagService) DeleteTag(id uint) error {
    return s.tagRepo.Delete(id)
}