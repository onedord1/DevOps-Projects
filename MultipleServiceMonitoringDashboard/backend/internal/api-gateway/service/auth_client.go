package service

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "net/http"
)

type AuthClient struct {
    baseURL string
}

func NewAuthClient(baseURL string) *AuthClient {
    return &AuthClient{baseURL: baseURL}
}

type LoginRequest struct {
    Username string `json:"username"`
    Password string `json:"password"`
}

type AuthResponse struct {
    Token string `json:"token"`
}

func (c *AuthClient) Login(ctx context.Context, username, password string) (*AuthResponse, error) {
    reqBody, _ := json.Marshal(LoginRequest{Username: username, Password: password})
    req, _ := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/api/v1/login", bytes.NewBuffer(reqBody))
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("auth service returned status %d", resp.StatusCode)
    }

    var authResp AuthResponse
    if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
        return nil, err
    }

    return &authResp, nil
}