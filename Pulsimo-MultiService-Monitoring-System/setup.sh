#!/bin/bash

set -e

echo "================================================"
echo "Multi-Service Monitoring System - Setup Script"
echo "================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker is installed: $(docker --version)"
echo "✅ Docker Compose is installed: $(docker-compose --version)"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    
    if [ "$(uname)" == "Darwin" ]; then
        # macOS
        sed -i '' "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" .env
    else
        # Linux
        sed -i "s/your-super-secret-jwt-key-change-in-production/$JWT_SECRET/" .env
    fi
    
    echo "✅ Created .env file with generated JWT secret"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and update:"
    echo "   - SMTP settings for email notifications"
    echo "   - Database password for production"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Create frontend .env.local if it doesn't exist
if [ ! -f frontend/.env.local ]; then
    echo "📝 Creating frontend/.env.local..."
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
    echo ""
else
    echo "✅ frontend/.env.local already exists"
    echo ""
fi

# Build Docker images
echo "🔨 Building Docker images..."
echo "This may take several minutes on first run..."
echo ""
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."
echo ""

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U monitoring &> /dev/null; then
    echo "✅ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL is not ready yet"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping &> /dev/null; then
    echo "✅ Redis is ready"
else
    echo "⚠️  Redis is not ready yet"
fi

# Check API Gateway
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ API Gateway is ready"
else
    echo "⚠️  API Gateway is not ready yet (may still be starting)"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "⚠️  Frontend is not ready yet (may still be starting)"
fi

echo ""
echo "================================================"
echo "✅ Setup complete!"
echo "================================================"
echo ""
echo "🌐 Access the application:"
echo "   Frontend:  http://localhost:3000"
echo "   API:       http://localhost:8080"
echo "   Health:    http://localhost:8080/health"
echo ""
echo "📚 Next steps:"
echo "   1. Visit http://localhost:3000"
echo "   2. Click 'Register' to create your organization"
echo "   3. Add your first service endpoint"
echo ""
echo "🔧 Useful commands:"
echo "   make logs          - View all logs"
echo "   make logs-api      - View API logs"
echo "   make ps            - List services"
echo "   make down          - Stop services"
echo "   make help          - Show all commands"
echo ""
echo "📖 For more information, see:"
echo "   - README.md for general documentation"
echo "   - DEPLOYMENT.md for deployment options"
echo ""
