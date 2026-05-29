# Script PowerShell para desarrollo local
# Ejecuta solo las bases de datos en Docker, todo lo demás localmente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Compliance Platform - Desarrollo Local" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker está corriendo
try {
    docker ps | Out-Null
} catch {
    Write-Host "ERROR: Docker no está corriendo" -ForegroundColor Red
    exit 1
}

Write-Host "[1/6] Iniciando bases de datos en Docker..." -ForegroundColor Yellow
docker-compose -f docker-compose-dev.yml up -d

Write-Host ""
Write-Host "Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[2/6] Verificando bases de datos..." -ForegroundColor Yellow
docker-compose -f docker-compose-dev.yml ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Bases de datos iniciadas correctamente" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "URLs disponibles:" -ForegroundColor Cyan
Write-Host "  PostgreSQL:    localhost:5432"
Write-Host "  MongoDB:       localhost:27017"
Write-Host "  MinIO API:     http://localhost:9000"
Write-Host "  MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
Write-Host ""

Write-Host "Ahora abre OTRAS TERMINALES (PowerShell o CMD) y ejecuta:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Terminal 1 - FastAPI:" -ForegroundColor Magenta
Write-Host "  cd services\document-fastapi" -ForegroundColor Gray
Write-Host "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Gray
Write-Host ""

Write-Host "Terminal 2 - Flask Gateway:" -ForegroundColor Magenta
Write-Host "  cd services\soap-gateway-flask" -ForegroundColor Gray
Write-Host "  python app/app.py" -ForegroundColor Gray
Write-Host ""

Write-Host "Terminal 3 - Mock SOAP Server:" -ForegroundColor Magenta
Write-Host "  cd services\mock-soap-server" -ForegroundColor Gray
Write-Host "  python app.py" -ForegroundColor Gray
Write-Host ""

Write-Host "Terminal 4 - BFF Node.js:" -ForegroundColor Magenta
Write-Host "  cd services\bff-node" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""

Write-Host "Terminal 5 - Frontend React:" -ForegroundColor Magenta
Write-Host "  cd services\frontend-react" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""

Write-Host "Acceso a la app:" -ForegroundColor Cyan
Write-Host "  Frontend:   http://localhost:3000" -ForegroundColor Green
Write-Host "  BFF API:    http://localhost:4000/api/v1" -ForegroundColor Green
Write-Host "  FastAPI:    http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""

Write-Host "Para detener las bases de datos:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose-dev.yml down" -ForegroundColor Gray
Write-Host ""

Write-Host "Los logs de Docker continuarán aquí. Abre otras terminales para los servicios." -ForegroundColor Cyan
Write-Host ""

# Mostrar logs
docker-compose -f docker-compose-dev.yml logs -f
