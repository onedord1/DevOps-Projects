-- +goose Up
-- Insert default system-wide tags (user_id = NULL means available to all users)
INSERT INTO tags (name, color, user_id) VALUES 
('Business', '#10B981', NULL),
('Personal', '#3B82F6', NULL),
('Essential', '#EF4444', NULL),
('Recurring', '#06B6D4', NULL),
('Meeting', '#F59E0B', NULL),
('Travel', '#8B5CF6', NULL),
('Food', '#F97316', NULL),
('Transportation', '#14B8A6', NULL),
('Shopping', '#EC4899', NULL),
('Entertainment', '#6366F1', NULL),
('Health', '#84CC16', NULL),
('Education', '#0EA5E9', NULL),
('Work', '#F97316', NULL),
('Home', '#A855F7', NULL),
('Family', '#EF4444', NULL),
('Urgent', '#DC2626', NULL),
('Subscription', '#64748B', NULL),
('Gift', '#F43F5E', NULL),
('Donation', '#0EA5E9', NULL),
('Tax', '#64748B', NULL);

-- +goose Down
-- Delete the default tags
DELETE FROM tags WHERE name IN (
    'Business', 
    'Personal', 
    'Essential', 
    'Recurring', 
    'Meeting', 
    'Travel', 
    'Food', 
    'Transportation', 
    'Shopping', 
    'Entertainment', 
    'Health', 
    'Education', 
    'Work', 
    'Home', 
    'Family', 
    'Urgent', 
    'Subscription', 
    'Gift', 
    'Donation', 
    'Tax'
);