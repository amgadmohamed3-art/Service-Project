# MovieReview MongoDB Atlas Setup Script (PowerShell)
# Usage: .\setup-mongodb.ps1

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MovieReview - MongoDB Atlas Setup Helper" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for MongoDB URI
$mongoUri = Read-Host "Enter your MongoDB Atlas Connection String"

if ([string]::IsNullOrWhiteSpace($mongoUri)) {
    Write-Host "Error: Connection string is required" -ForegroundColor Red
    exit 1
}

# Function to create .env file
function Create-EnvFile {
    param(
        [string]$ServicePath,
        [string]$ServiceName,
        [string]$MongoUri,
        [string]$Port,
        [string[]]$AdditionalVars = @()
    )
    
    $envPath = "$ServicePath\.env"
    
    # Create content
    $content = @"
MONGO_URI=$MongoUri/$ServiceName`?retryWrites=true&w=majority
PORT=$Port
"@
    
    # Add additional variables
    foreach ($var in $AdditionalVars) {
        $content += "`n$var"
    }
    
    # Write to file
    Set-Content -Path $envPath -Value $content
    Write-Host "✓ Created $ServicePath/.env" -ForegroundColor Green
}

# Create .env files
Write-Host "Creating .env files..." -ForegroundColor Yellow
Write-Host ""

Create-EnvFile -ServicePath "user-service" -ServiceName "user-service" -MongoUri $mongoUri -Port "4001"
Create-EnvFile -ServicePath "auth-service" -ServiceName "auth-service" -MongoUri $mongoUri -Port "4000" -AdditionalVars @("JWT_SECRET=your-secret-key-change-this-in-production")
Create-EnvFile -ServicePath "review-service" -ServiceName "review-service" -MongoUri $mongoUri -Port "4003"
Create-EnvFile -ServicePath "content-service" -ServiceName "content-service" -MongoUri $mongoUri -Port "4004"

# Search service doesn't need MongoDB
$searchEnvPath = "search-service\.env"
Set-Content -Path $searchEnvPath -Value "PORT=4005"
Write-Host "✓ Created search-service/.env" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the .env files in each service directory" -ForegroundColor White
Write-Host "2. Update JWT_SECRET in auth-service/.env" -ForegroundColor White
Write-Host "3. Run: npm install in each service" -ForegroundColor White
Write-Host "4. Run: npm start in each service (use separate terminals)" -ForegroundColor White
Write-Host "5. Run: npm start in frontend directory" -ForegroundColor White
Write-Host ""
Write-Host "For more info, see: MONGODB_ATLAS_SETUP.md" -ForegroundColor Cyan
Write-Host ""
