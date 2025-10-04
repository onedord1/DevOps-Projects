package service

// Removed the unused "context" import

type TemplateService interface {
    // Define methods for template management
}

type templateService struct {
    // Add dependencies like a repository
}

func NewTemplateService() TemplateService {
    return &templateService{}
}