#!/bin/bash
# Quick setup script for local development

set -e

echo "🚀 Setting up TicketDesk for local development..."
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting."; exit 1; }
echo "✅ Prerequisites OK"
echo ""

# Backend setup
echo "🔧 Setting up backend..."
cd backend

if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "📦 Installing Python dependencies..."
source venv/bin/activate || . venv/Scripts/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "🗄️  Running database migrations..."
alembic upgrade head

echo "✅ Backend setup complete!"
cd ..
echo ""

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend

if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
fi

echo "📦 Installing Node dependencies..."
npm install

echo "✅ Frontend setup complete!"
cd ..
echo ""

# Final instructions
echo "=" * 70
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate  # or: . venv/Scripts/activate on Windows"
echo "   uvicorn main:app --reload"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "📚 For production deployment, see DEPLOYMENT.md"
echo "=" * 70
