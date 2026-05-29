@echo off
REM Script para ejecutar todos los servicios localmente en desarrollo
REM Ejecuta esto en PowerShell o CMD desde la raíz del proyecto

echo ========================================
echo Compliance Platform - Desarrollo Local
echo ========================================
echo.

REM Verificar que Docker está corriendo
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker no está corriendo
    pause
    exit /b 1
)

echo [1/6] Iniciando bases de datos en Docker...
docker-compose -f docker-compose-dev.yml up -d

echo.
echo Esperando a que PostgreSQL esté listo...
timeout /t 5 /nobreak

echo.
echo [2/6] Verificando bases de datos...
docker-compose -f docker-compose-dev.yml ps

echo.
echo ========================================
echo Bases de datos iniciadas correctamente
echo ========================================
echo.
echo URLs disponibles:
echo   PostgreSQL:    localhost:5432
echo   MongoDB:       localhost:27017
echo   MinIO API:     http://localhost:9000
echo   MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
echo.
echo Ahora abre otras TERMINALES y ejecuta:
echo.
echo Terminal 1 - FastAPI:
echo   cd services\document-fastapi
echo   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo Terminal 2 - Flask Gateway:
echo   cd services\soap-gateway-flask
echo   python app/app.py
echo.
echo Terminal 3 - Mock SOAP Server:
echo   cd services\mock-soap-server
echo   python app.py
echo.
echo Terminal 4 - BFF Node.js:
echo   cd services\bff-node
echo   npm run dev
echo.
echo Terminal 5 - Frontend React:
echo   cd services\frontend-react
echo   npm run dev
echo.
echo Acceso a la app:
echo   Frontend:   http://localhost:3000
echo   BFF API:    http://localhost:4000/api/v1
echo   FastAPI:    http://localhost:8000/docs
echo.
echo Para detener todo:
echo   docker-compose -f docker-compose-dev.yml down
echo.
pause
