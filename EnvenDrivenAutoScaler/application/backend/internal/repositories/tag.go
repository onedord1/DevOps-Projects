package repositories

import (
	"gorm.io/gorm"

	"expense-tracker/internal/models"
)

type TagRepository struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) *TagRepository {
	return &TagRepository{db: db}
}

func (r *TagRepository) GetAll() ([]models.Tag, error) {
	var tags []models.Tag
	result := r.db.Where("user_id IS NULL").Find(&tags)
	return tags, result.Error
}

func (r *TagRepository) GetByID(id uint) (*models.Tag, error) {
	var tag models.Tag
	result := r.db.First(&tag, id)
	return &tag, result.Error
}

func (r *TagRepository) Create(tag *models.Tag) error {
	return r.db.Create(tag).Error
}

func (r *TagRepository) Update(tag *models.Tag) error {
	return r.db.Save(tag).Error
}

func (r *TagRepository) Delete(id uint) error {
	return r.db.Delete(&models.Tag{}, id).Error
}

func (r *TagRepository) FindByIDs(ids []uint) *gorm.DB {
	return r.db.Where("id IN ?", ids)
}
