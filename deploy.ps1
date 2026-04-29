# =============================================================================
# deploy.ps1
# =============================================================================
# Script de deploy del sitio TM&H a la rama `production` de GitHub.
#
# Lo que hace:
#   1. Builda el sitio Astro con la base correcta (default `/tmyh-web/` para
#      el preview; pasale `-Cutover` cuando quieras servir desde root).
#   2. Crea una rama `production` limpia con SOLO el contenido del `dist/`
#      en root, separada del source code.
#   3. Pushea esa rama a GitHub. Ferozo la pulea con "Sincronizar".
#
# Uso:
#   PS> .\deploy.ps1                    # build con base /tmyh-web/ (preview)
#   PS> .\deploy.ps1 -Cutover           # build con base / (sitio en raiz)
#
# Pre-requisitos:
#   - SSH key configurada para git@github.com:tradicionmisticayhermetica-web
#   - Node + npm instalados
#   - tmyh-web/.env con PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY
# =============================================================================

param(
    [switch]$Cutover,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$webDir = Join-Path $repoRoot "tmyh-web"
$distDir = Join-Path $webDir "dist"
$tempDir = Join-Path $env:TEMP "tmyh-prod-deploy"
$remoteUrl = "git@github.com:tradicionmisticayhermetica-web/tmyh-web.git"
$basePath = if ($Cutover) { "/" } else { "/tmyh-web/" }

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Deploy TM&H · base = $basePath" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Build ----------------------------------------------------------------

if (-not $SkipBuild) {
    Write-Host "[1/4] Building sitio Astro con BASE_PATH=$basePath..." -ForegroundColor Yellow
    Push-Location $webDir
    try {
        $env:BASE_PATH = $basePath
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Build de Astro fallo"
        }
    } finally {
        Pop-Location
        $env:BASE_PATH = $null
    }
} else {
    Write-Host "[1/4] Build saltado (--SkipBuild)" -ForegroundColor DarkGray
}

if (-not (Test-Path $distDir)) {
    throw "No existe $distDir. Sin dist/ no hay que deployar."
}

# --- 2. Preparar directorio temporal con la rama production ------------------

Write-Host ""
Write-Host "[2/4] Preparando rama production..." -ForegroundColor Yellow

if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }

# Intentamos clonar la rama production existente (preserva historia).
# Si no existe, hacemos init nuevo.
git clone --branch production --single-branch $remoteUrl $tempDir 2>&1 | Out-Null
$cloneOk = $LASTEXITCODE -eq 0

if ($cloneOk) {
    Write-Host "  Rama production existente clonada (mantiene historia)" -ForegroundColor DarkGray
    Push-Location $tempDir
    # Borramos contenido viejo (excepto .git)
    Get-ChildItem -Force | Where-Object { $_.Name -ne ".git" } | Remove-Item -Recurse -Force
} else {
    Write-Host "  Rama production no existe, creandola desde cero" -ForegroundColor DarkGray
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    Push-Location $tempDir
    git init -q
    git checkout -q -b production
    git remote add origin $remoteUrl
}

try {
    # Identidad de los commits del deploy
    git config user.name "tradicionmisticayhermetica-web"
    git config user.email "tradicionmisticayhermetica@gmail.com"

    # --- 3. Copiar dist/ y commit -------------------------------------------

    Write-Host ""
    Write-Host "[3/4] Copiando dist/ y commiteando..." -ForegroundColor Yellow
    Copy-Item -Recurse -Force "$distDir\*" "."

    git add -A
    $changes = git status --porcelain
    if (-not $changes) {
        Write-Host "  Sin cambios. Nada para deployar." -ForegroundColor Green
        return
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $msg = "deploy: $basePath ($timestamp)"
    git commit -m $msg -q

    # --- 4. Push -----------------------------------------------------------

    Write-Host ""
    Write-Host "[4/4] Pusheando production a GitHub..." -ForegroundColor Yellow
    git push origin production

    if ($LASTEXITCODE -ne 0) { throw "Push a production fallo" }
} finally {
    Pop-Location
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Deploy COMPLETO" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximo paso: en Ferozo, panel GIT -> Sincronizar (hace git pull"
Write-Host "de la rama production a public_html/tmyh-web/)."
Write-Host ""
