# Compliance Platform

Sistema completo de procesamiento y verificación de compliance de documentos con arquitectura de microservicios.

## 📋 Servicios

- **Frontend React** - Interfaz web moderna con Vite
- **BFF Node.js + Express** - Backend for Frontend con Socket.IO para notificaciones en tiempo real
- **FastAPI** - Servicio de procesamiento y gestión de documentos
- **Flask Gateway** - Gateway SOAP para verificación de compliance
- **Mock SOAP Server** - Servidor SOAP para testing de verificación de compliance
- **PostgreSQL** - Base de datos principal (documentos, compliance checks)
- **MongoDB** - Base de datos NoSQL (auditoría, logs)
- **MinIO** - Almacenamiento de objetos (archivos de documentos)

## 🏗️ Arquitectura

```
Frontend (React) 
    ↓
BFF (Express + Socket.IO)
    ├→ FastAPI (Documentos + MinIO)
    └→ Flask Gateway
        └→ Mock SOAP Server (Verificación)
        
Bases de datos:
- PostgreSQL: documentos, compliance_checks
- MongoDB: auditoría, logs
- MinIO: almacenamiento de archivos
```

## 🚀 Inicio rápido

### Requisitos
- Docker y Docker Compose
- Node.js 20+ (para desarrollo local sin Docker)
- Python 3.11+ (para desarrollo local sin Docker)

### Levantar todo con Docker

```bash
docker-compose up --build
```

Espera a que todos los servicios estén listos. Verás mensajes como:
```
compliance_bff | BFF corriendo en puerto 4000
compliance_frontend | [2024-05-28 ...] Listening on 0.0.0.0:3000
```

### Acceder a la aplicación

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Frontend** | http://localhost:3000 | - |
| **BFF API** | http://localhost:4000/api/v1 | - |
| **FastAPI Docs** | http://localhost:8000/docs | - |
| **MinIO Console** | http://localhost:9001 | minioadmin/minioadmin |
| **PostgreSQL** | localhost:5432 | postgres/password |
| **MongoDB** | localhost:27017 | - |

## 📝 Variables de Entorno (.env)

```env
# Base de datos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=compliance_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# MongoDB
MONGO_URI=mongodb://mongodb:27017

# MinIO (almacenamiento)
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=documents

# SOAP
SOAP_URL=http://mock-soap:8090/soap

# BFF
BFF_URL=http://express-bff:4000
```

## 🔄 Flujo de Trabajo

1. **Upload de documento**
   - Usuario sube archivo desde frontend
   - BFF recibe y reenvía a FastAPI
   - FastAPI guarda en PostgreSQL y MinIO

2. **Verificación de Compliance**
   - Usuario hace click en "Verificar compliance"
   - FastAPI contacta Flask Gateway
   - Flask Gateway envía SOAP request al Mock Server
   - Resultado se guarda en PostgreSQL

3. **Notificaciones en Tiempo Real**
   - Cuando termina el procesamiento, FastAPI notifica al BFF
   - BFF emite evento por Socket.IO
   - Frontend recibe en tiempo real

## 🛠️ Desarrollo Local

### Setup inicial

```bash
# Instalar dependencias del BFF
cd services/bff-node
npm install

# Instalar dependencias del Frontend
cd services/frontend-react
npm install

# Instalar dependencias de FastAPI
cd services/document-fastapi
pip install -r requirements.txt

# Instalar dependencias de Flask
cd services/soap-gateway-flask
pip install -r requirements.txt
```

### Ejecutar servicios localmente

```bash
# Terminal 1: BFF
cd services/bff-node
npm run dev

# Terminal 2: Frontend
cd services/frontend-react
npm run dev

# Terminal 3: FastAPI
cd services/document-fastapi
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 4: Flask Gateway
cd services/soap-gateway-flask
python app/app.py

# Terminal 5: Mock SOAP Server
cd services/mock-soap-server
python app.py

# Terminal 6: Bases de datos (Docker)
docker-compose up postgres mongodb minio
```

## 📚 API Endpoints

### BFF (puerto 4000)

```
GET    /health - Health check
GET    /api/v1/dashboard/summary - Resumen del dashboard
GET    /api/v1/documents - Listar documentos (paginado)
GET    /api/v1/documents/{id} - Detalle de documento
POST   /api/v1/documents/upload - Subir documento
POST   /api/v1/documents/{id}/process - Procesar/verificar documento
POST   /api/v1/webhooks/processing-complete - Webhook (interno)
```

### FastAPI (puerto 8000)

```
GET    /health - Health check
GET    /api/v1/documents/ - Listar documentos
GET    /api/v1/documents/{id} - Detalle de documento
POST   /api/v1/documents/upload - Subir documento
POST   /api/v1/documents/{id}/process - Procesar documento
```

### Flask Gateway (puerto 8001)

```
GET    /health - Health check
POST   /api/v1/compliance/check - Verificar compliance
GET    /api/v1/compliance/status/{document_id} - Estado de verificación
```

### Mock SOAP Server (puerto 8090)

```
GET    /health - Health check
POST   /soap - Endpoint SOAP para verificar compliance
```

## 🧪 Testing

### Health checks

```bash
curl http://localhost:4000/health
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8090/health
```

### Subir documento de prueba

```bash
curl -X POST http://localhost:4000/api/v1/documents/upload \
  -F "file=@test.pdf" \
  -F "document_type=financial_report"
```

### Listar documentos

```bash
curl http://localhost:4000/api/v1/documents?page=1&limit=10
```

## 📊 Modelos de Datos

### Documento
```json
{
  "id": "uuid",
  "filename": "string",
  "document_type": "financial_report|tax_filing|regulatory_disclosure",
  "storage_path": "string",
  "status": "UPLOADED|PROCESSED",
  "created_at": "timestamp"
}
```

### Compliance Check
```json
{
  "id": "uuid",
  "document_id": "uuid",
  "status": "COMPLIANT|NON_COMPLIANT",
  "details": "string",
  "checked_at": "timestamp"
}
```

## 🐛 Troubleshooting

### Puerto 5432 ya en uso
```bash
docker-compose down
docker system prune -a
```

### MinIO no inicia
Eliminar volumen de datos:
```bash
docker volume rm compliance-platform_minio_data
```

### Conexión rechazada en Flask
Asegurar que PostgreSQL esté corriendo:
```bash
docker-compose logs postgres
```

## 📄 Licencia

MIT

## 👥 Autor

Compliance Platform Team
