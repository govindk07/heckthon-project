#!/bin/bash

# Setup script for Simple Web Application
echo "🚀 Setting up Simple Web Application..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "✅ Created .env.local file. Please update it with your Supabase credentials."
else
    echo "⚠️  .env.local already exists. Skipping creation."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed."
else
    echo "✅ Dependencies already installed."
fi

echo ""
echo "🎯 Next steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Run the SQL in supabase-setup.sql in your Supabase SQL Editor"
echo "3. Update .env.local with your Supabase URL and keys"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "📚 See README.md for detailed setup instructions."
