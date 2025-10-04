package models

import (
    "time"

    "github.com/google/uuid"
)

type User struct {
    ID             uuid.UUID `json:"id" db:"id"`
    Username       string    `json:"username" db:"username"`
    Email          string    `json:"email" db:"email"`
    HashedPassword string    `json:"-" db:"hashed_password"`
    Role           string    `json:"role" db:"role"`
    CreatedAt      time.Time `json:"created_at" db:"created_at"`
    UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}