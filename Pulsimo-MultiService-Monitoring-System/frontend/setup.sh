#!/bin/bash

##############################################################################
# Frontend Setup Script
# 
# This script ensures all dependencies are installed correctly.
# Run this after:
# - Fresh clone of repository
# - Deleting node_modules
# - Switching branches
#
# Usage: ./setup.sh
##############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Frontend Setup Script${NC}\n"

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️  Not in frontend directory. Changing to frontend...${NC}"
    cd "$(dirname "$0")" || exit 1
fi

# Check Node version
echo -e "${BLUE}📋 Checking Node.js version...${NC}"
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}\n"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies with --legacy-peer-deps...${NC}"
echo -e "${YELLOW}   This ensures compatibility with all packages${NC}\n"

npm install --legacy-peer-deps

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}🎉 You can now run:${NC}"
echo -e "   ${BLUE}npm run dev${NC}     - Start development server"
echo -e "   ${BLUE}npm run build${NC}   - Build for production"
echo -e "   ${BLUE}npm run lint${NC}    - Run linter\n"
