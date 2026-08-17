param(
    [string]$Message = "chore: sync changes",
    [string]$Remote = "origin",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$Text) {
    Write-Host $Text -ForegroundColor Cyan
}

function Write-Warn([string]$Text) {
    Write-Host $Text -ForegroundColor Yellow
}

function Write-Success([string]$Text) {
    Write-Host $Text -ForegroundColor Green
}

Write-Info "Checking git status..."
$status = git status --porcelain

if ($LASTEXITCODE -ne 0) {
    throw "git status failed."
}

if ($status) {
    Write-Info "Staging changes..."
    git add .
    if ($LASTEXITCODE -ne 0) {
        throw "git add failed."
    }

    Write-Info "Committing changes..."
    git commit -m $Message
    if ($LASTEXITCODE -ne 0) {
        throw "git commit failed."
    }
} else {
    Write-Warn "No local changes to commit."
}

Write-Info "Pushing to $Remote/$Branch..."
git push $Remote $Branch
if ($LASTEXITCODE -ne 0) {
    throw "git push failed."
}

Write-Success "Done. Repository is synced."
