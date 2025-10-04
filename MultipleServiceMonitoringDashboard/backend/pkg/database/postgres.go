package database

import (
    "context"
    "fmt"
    "log"

    "github.com/jackc/pgx/v5/pgxpool"
)

type PostgresDB struct {
    Pool *pgxpool.Pool
}

func NewPostgresDB(connString string) (*PostgresDB, error) {
    pool, err := pgxpool.New(context.Background(), connString)
    if err != nil {
        return nil, fmt.Errorf("unable to create connection pool: %w", err)
    }

    // Test the connection
    if err := pool.Ping(context.Background()); err != nil {
        return nil, fmt.Errorf("unable to ping database: %w", err)
    }

    log.Println("Successfully connected to PostgreSQL!")
    return &PostgresDB{Pool: pool}, nil
}

func (db *PostgresDB) Close() {
    db.Pool.Close()
}