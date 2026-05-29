# Compliance Platform

🏛️ Sistema completo de procesamiento y verificación de compliance de documentos con arquitectura de microservicios.

**Evaluación**: Semi-Senior | **Entorno**: 100% Local (Docker) | **Lenguajes**: Python, Node.js, React, TypeScript

---

## 📋 Servicios

| Servicio | Tecnología | Puerto | Descripción |
|----------|-----------|--------|------------|
| **Frontend** | React + Vite + TypeScript | 3000 | Interfaz web moderna |
| **BFF** | Express.js + Socket.IO | 4000 | Backend for Frontend con notificaciones |
| **FastAPI** | Python/FastAPI | 8000 | Procesamiento y gestión de documentos |
| **Flask Gateway** | Python/Flask | 8001 | Gateway SOAP para compliance |
| **Mock SOAP** | Python/Flask | 8090 | Servidor SOAP gubernamental simulado |
| **PostgreSQL** | SQL | 5432 | Base de datos relacional |
| **MongoDB** | NoSQL | 27017 | Base de datos de auditoría |
| **MinIO** | Object Storage | 9000/9001 | Almacenamiento de objetos |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React :3000)                   │
│              Upload Form + Document List + Details          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          BFF (Express.js + Socket.IO :4000)                │
│   Dashboard │ Upload Proxy │ Webhooks │ Notifications      │
└───┬─────────────────────────────────────┬───────────────────┘
    │                                     │
    │ REST API                            │ REST API
    ▼                                     ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│   FastAPI (:8000)        │  │  Flask Gateway (:8001)       │
│  • Document Upload       │  │  • SOAP Translation          │
│  • MinIO Integration     │  │  • Compliance Verification   │
│  • PostgreSQL            │  │  • PostgreSQL Persistence    │
└────────────┬─────────────┘  └──────────────┬────────────────┘
             │                               │
             │ MinIO API                     │ SOAP Request
             ▼                               ▼
       ┌─────────────────┐         ┌──────────────────────┐
       │  MinIO (9000)   │         │ Mock SOAP (:8090)    │
       │  Documents      │         │ Gov't System Sim     │
       └─────────────────┘         └──────────────────────┘

📊 DATABASES:
┌─────────────┐   ┌──────────────┐   ┌────────────────┐
│ PostgreSQL  │   │  MongoDB     │   │  MinIO         │
│ Documents   │   │  Audit Logs  │   │  File Storage  │
│ Compliance  │   │              │   │                │
└─────────────┘   └──────────────┘   └────────────────┘
```

---

## 🚀 Inicio Rápido

### Prerequisitos

- **Docker Desktop** (Windows/Mac) o **Docker + Docker Compose** (Linux)
- **Git**
- Mínimo 4GB RAM disponible

### 1️⃣ Clonar y configurar

```bash
git clone https://github.com/smringdesigns/document-compliance-platform.git
cd compliance-platform
```

### 2️⃣ Levantar todo con Docker

```bash
docker-compose up --build
```

Verás algo como:
```
✓ compliance_postgres is healthy
✓ compliance_mongodb is healthy
✓ compliance_minio is healthy
✓ compliance_mock_soap started
✓ compliance_fastapi started
✓ compliance_flask_gateway started
✓ compliance_bff started
✓ compliance_frontend started
```

### 3️⃣ Acceder a la aplicación

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Frontend** | http://localhost:3000 | - |
| **FastAPI Swagger** | http://localhost:8000/docs | - |
| **MinIO Console** | http://localhost:9001 | minioadmin/minioadmin |
| **BFF API** | http://localhost:4000/api/v1 | - |

---

## 📝 Variables de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=compliance_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# MongoDB
MONGO_URI=mongodb://mongodb:27017/compliance

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=documents
MINIO_SECURE=false

# SOAP Mock Server
SOAP_URL=http://mock-soap:8090/soap

# BFF
FASTAPI_URL=http://fastapi:8000
FLASK_URL=http://flask-gateway:8001
PORT=4000
```

---

## 🔄 Flujo de Trabajo Completo

### 1. Upload de Documento

```
User (Frontend) 
  ↓ POST /upload (multipart)
BFF (Express)
  ↓ Forward a FastAPI
FastAPI
  ↓ Upload a MinIO
  ↓ Guardar en PostgreSQL
  ↓ Return metadata a BFF
BFF → Frontend (Success)
```

### 2. Verificación de Compliance

```
User hace click "Verificar Compliance"
  ↓ POST /documents/{id}/process
FastAPI
  ↓ Llama Flask Gateway
Flask Gateway
  ↓ Construye XML SOAP
  ↓ Envía a Mock SOAP Server
Mock SOAP
  ↓ Retorna COMPLIANT/NON_COMPLIANT
Flask
  ↓ Parsea respuesta XML
  ↓ Guarda en PostgreSQL
  ↓ Retorna JSON a FastAPI
FastAPI
  ↓ Llama webhook a BFF
BFF
  ↓ Emite Socket.IO event
Frontend
  ↓ Recibe en tiempo real
  ↓ Actualiza UI
```

---

## 📚 API Endpoints

### BFF (Express) - Puerto 4000

```http
GET  /health
     → { status: "ok" }

GET  /api/v1/dashboard/summary
     → { total_documents, uploaded, processed, recent_documents }

GET  /api/v1/documents?page=1&limit=10
     → { total, page, limit, items: [...] }

GET  /api/v1/documents/{id}
     → { id, filename, document_type, status, compliance: {...} }

POST /api/v1/documents/upload
     Headers: multipart/form-data
     Fields: file, document_type
     → { id, filename, status, created_at }

POST /api/v1/documents/{id}/process
     → { status: "PROCESSING" }

POST /api/v1/webhooks/processing-complete (Internal)
```

### FastAPI - Puerto 8000

```http
GET  /health
     → { status: "ok" }

GET  /api/v1/documents/?page=1&limit=10
     → { total, page, limit, items: [...] }

GET  /api/v1/documents/{id}
     → Document object

POST /api/v1/documents/upload
     → { id, filename, status, created_at }

POST /api/v1/documents/{id}/process
     → { status: "PROCESSED", compliance: {...} }
```

### Flask Gateway - Puerto 8001

```http
GET  /health
     → { status: "ok" }

POST /api/v1/compliance/check
     Body: { document_id, document_type, storage_path }
     → { status, check_id, details, checked_at }

GET  /api/v1/compliance/status/{document_id}
     → { status, details, checked_at }
```

### Mock SOAP Server - Puerto 8090

```http
GET  /health
     → { status: "ok" }

POST /soap
     Body: XML SOAP Envelope
     Response: XML SOAP Response (COMPLIANT|NON_COMPLIANT)
```

---

## 🧪 Testing

### Verificar Health Checks

```bash
# Todos los servicios
for svc in 3000 4000 8000 8001 8090; do
  echo "Testing port $svc..."
  curl -s http://localhost:$svc/health | jq .
done
```

### Test End-to-End

```bash
# 1. Subir documento
FILE_UPLOAD=$(curl -X POST http://localhost:4000/api/v1/documents/upload \
  -F "file=@test.pdf" \
  -F "document_type=financial_report")

DOC_ID=$(echo $FILE_UPLOAD | jq -r '.id')
echo "Documento subido: $DOC_ID"

# 2. Listar documentos
curl http://localhost:4000/api/v1/documents?page=1&limit=5 | jq .

# 3. Obtener detalle
curl http://localhost:4000/api/v1/documents/$DOC_ID | jq .

# 4. Procesar/Verificar
curl -X POST http://localhost:4000/api/v1/documents/$DOC_ID/process | jq .

# 5. Esperar 2s y ver compliance
sleep 2
curl http://localhost:4000/api/v1/documents/$DOC_ID | jq '.compliance'
```

### Tests Unitarios

```bash
# FastAPI tests
cd services/document-fastapi
pytest tests/ -v

# Flask tests
cd services/soap-gateway-flask
pytest tests/ -v

# Node tests
cd services/bff-node
npm test
```

---

## 📊 Bases de Datos

### PostgreSQL (puerto 5432)

```sql
-- Tablas principales
CREATE TABLE users (
  id UUID PRIMARY KEY
);

CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID,
  filename VARCHAR,
  document_type VARCHAR,
  storage_path VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY,
  document_id UUID,
  status VARCHAR,
  details VARCHAR,
  checked_at TIMESTAMP
);
```

### MongoDB (puerto 27017)

```javascript
// Colecciones
db.audit_logs.insert({...})
db.processing_events.insert({...})
```

### MinIO (puerto 9000/9001)

```
Bucket: documents/
Objects: {document_id}_{filename}
```

---

## 🐛 Troubleshooting

### Puertos en uso

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

### Reiniciar todo limpio

```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### FastAPI no conecta a PostgreSQL

```bash
docker-compose logs fastapi
# Verificar que postgres está healthy:
docker-compose ps
```

### Socket.IO no funciona

1. Verificar BFF está corriendo: `curl http://localhost:4000/health`
2. Abrir DevTools → Network → WS
3. Buscar conexión a `/notifications`

---

## 🏦 OCI Object Storage (Producción)

Para reemplazar MinIO con Oracle Cloud Object Storage:

1. Crear bucket en OCI
2. Generar credenciales (Access Key / Secret Key)
3. Actualizar `services/document-fastapi/app/services/minio_service.py`:

```python
from oci.object_storage import ObjectStorageClient

client = ObjectStorageClient(
    config=oci_config,
    namespace="tu-namespace",
    bucket_name="compliance-docs"
)
```

4. Actualizar `.env`:
```env
MINIO_ENDPOINT=<OCI-endpoint>
MINIO_REGION=<region>
OCI_CONFIG_PATH=/path/to/.oci/config
```

---

## 🔐 Seguridad

### Production Checklist

- [ ] Cambiar credenciales por defecto (MinIO, PostgreSQL)
- [ ] Habilitar HTTPS en todos los endpoints
- [ ] Usar variables de entorno para secretos (no hardcodear)
- [ ] Implementar autenticación JWT
- [ ] Agregar rate limiting
- [ ] Validar tipos MIME de uploads
- [ ] Implementar CORS restrictivo
- [ ] Usar secrets de Docker para credenciales

---

## 📈 Performance Tips

- **Caching**: Redis en BFF para dashboard summary
- **CDN**: CloudFront/Cloudflare para frontend assets
- **Database**: Indexes en `documents.status`, `compliance_checks.document_id`
- **Storage**: Multi-part uploads en MinIO para archivos grandes
- **Async**: Procesar compliance en background jobs (Celery)

---

## 📋 Requisitos Cumplidos

✅ Arquitectura multi-servicio (5 servicios + 3 BDs)
✅ REST + SOAP integration
✅ Object Storage (MinIO)
✅ Docker Compose 100% funcional
✅ Tests (FastAPI, Flask, Node)
✅ CI/CD configurado (GitHub Actions)
✅ Notificaciones en tiempo real (Socket.IO)
✅ React frontend con paginación
✅ TypeScript en BFF
✅ Documentación completa

---

## 🤝 Contribución

1. Fork el repo
2. Crea rama: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 Licencia

MIT License - ver `LICENSE` para detalles

---

## ✉️ Contacto

**Autor**: Stivenson Mussa R. 
**Email**: elmus_18@hotmail.com  
**GitHub**: https://github.com/smringdesigns 
**Linkedin**: https://www.linkedin.com/in/stivenson-mussa-rodriguez/ 
---

**Última actualización**: May 27, 2026
**Versión**: 1.0.0 (Production Ready)


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
