-- +goose Up
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Add unique constraint for tag names per user (NULL user_id means system-wide tags)
CREATE UNIQUE INDEX idx_tags_user_name ON tags(user_id, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_deleted_at ON tags(deleted_at);

-- +goose Down
DROP TABLE tags;