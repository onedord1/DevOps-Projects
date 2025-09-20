-- +goose Up
CREATE TABLE transaction_tags (
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- +goose Down
DROP TABLE transaction_tags;