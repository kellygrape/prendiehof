#!/bin/bash

echo "🎯 Setting up Hall of Fame Nominations Portal..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo ""

# Setup backend
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env and set your JWT_SECRET!"
fi

cd ..

# Setup frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit backend/.env and set a secure JWT_SECRET"
echo "   2. Open two terminal windows:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   $ cd backend && npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ cd frontend && npm run dev"
echo ""
echo "   3. Open http://localhost:3000 in your browser"
echo "   4. Create your first admin account"
echo ""
echo "🚀 Happy voting!"
