#!/bin/bash

# Script để start tất cả services cho local development
# Usage: ./start-local.sh

set -e

echo "🚀 Starting local development environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo -e "${GREEN}✓ Created .env.local from .env.local.example${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env.local with your database URL${NC}"
    else
        echo "DATABASE_URL=\"file:./dev.db\"" > .env.local
        echo "NEXT_PUBLIC_VNSTOCK_SERVICE_URL=\"http://localhost:8000\"" >> .env.local
        echo -e "${GREEN}✓ Created .env.local with default SQLite config${NC}"
    fi
fi

# Check if Python venv exists
if [ ! -d "vnstock_service/venv" ]; then
    echo -e "${YELLOW}⚠️  Python venv not found. Creating...${NC}"
    cd vnstock_service
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✓ Python venv created and dependencies installed${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing...${NC}"
    npm install
    echo -e "${GREEN}✓ Node dependencies installed${NC}"
fi

# Generate Prisma Client
echo ""
echo "📦 Generating Prisma Client..."
npx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Start Python service in background
echo ""
echo "🐍 Starting Python vnstock service..."
cd vnstock_service
source venv/bin/activate
uvicorn main:app --reload --port 8000 > ../vnstock_service.log 2>&1 &
PYTHON_PID=$!
cd ..
echo -e "${GREEN}✓ Python service started (PID: $PYTHON_PID)${NC}"
echo "   Logs: tail -f vnstock_service.log"
echo "   URL: http://localhost:8000"

# Wait a bit for Python service to start
sleep 2

# Start Next.js dev server
echo ""
echo "⚛️  Starting Next.js dev server..."
echo "   URL: http://localhost:3000"
echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C to kill background processes
trap "kill $PYTHON_PID 2>/dev/null; exit" INT TERM

# Start Next.js (foreground)
npm run dev

