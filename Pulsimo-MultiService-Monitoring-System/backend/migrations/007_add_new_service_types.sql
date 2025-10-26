-- Migration: Add websocket and grpc service types
-- This migration extends the service_type enum to support WebSocket and gRPC services

-- Add new service types to the enum
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'websocket';
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'grpc';
