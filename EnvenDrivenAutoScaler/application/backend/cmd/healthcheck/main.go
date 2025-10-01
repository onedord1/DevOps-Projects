package main

import (
    "fmt"
    "net/http"
    "os"
    "time"
)

func main() {
    client := &http.Client{
        Timeout: 2 * time.Second,
    }
    
    resp, err := client.Get("http://localhost:7070/health")
    if err != nil {
        fmt.Printf("Health check failed: %v\n", err)
        os.Exit(1)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        fmt.Printf("Health check failed with status: %s\n", resp.Status)
        os.Exit(1)
    }
    
    fmt.Println("Health check passed")
    os.Exit(0)
}