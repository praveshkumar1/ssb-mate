# PowerShell deployment script for Windows
Write-Host "🚀 SSB Connect Deployment Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if git repo exists
if (-not (Test-Path ".git")) {
    Write-Host "❌ No git repository found. Run 'git init' first." -ForegroundColor Red
    exit 1
}

# Test builds locally first
Write-Host "🔧 Testing builds..." -ForegroundColor Yellow

Set-Location backend
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}

Set-Location ../frontend
npm install  
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host "✅ Local builds successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Push to GitHub: git add . && git commit -m 'Deploy setup' && git push"
Write-Host "2. Backend: Go to render.com → New Web Service → Connect repo"
Write-Host "3. Frontend: Go to netlify.com → New site from Git → Connect repo" 
Write-Host "4. Add environment variables to both platforms"
Write-Host ""
Write-Host "📖 See DEPLOYMENT.md for detailed instructions" -ForegroundColor Yellow