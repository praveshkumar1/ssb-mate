#!/bin/bash
# Quick deployment script

echo "🚀 SSB Connect Deployment Script"
echo "=================================="

# Check if git repo exists
if [ ! -d ".git" ]; then
    echo "❌ No git repository found. Run 'git init' first."
    exit 1
fi

# Test builds locally first
echo "🔧 Testing builds..."
cd backend
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi

cd ../frontend  
npm install
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo "✅ Local builds successful!"
echo ""
echo "📋 Next steps:"
echo "1. Push to GitHub: git add . && git commit -m 'Deploy setup' && git push"
echo "2. Backend: Go to render.com → New Web Service → Connect repo"
echo "3. Frontend: Go to netlify.com → New site from Git → Connect repo"
echo "4. Add environment variables to both platforms"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"