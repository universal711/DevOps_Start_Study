echo "🚀 Setting up Visit Counter project..."

# Create directory structure
mkdir -p app kubernetes scripts .github/workflows

# Install dependencies
cd app
npm install
cd ..

echo "✅ Setup complete!"
echo "📁 Project structure:"
find . -type f -name "*.json" -o -name "*.js" -o -name "*.yaml" -o -name "*.yml" | sort
