import express, { Request, Response } from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';

const app    = express();
const server = http.createServer(app);

// URLs de los servicios backend — vienen del entorno
const FASTAPI_URL = process.env.FASTAPI_URL ?? 'http://fastapi:8000';
const FLASK_URL   = process.env.FLASK_URL   ?? 'http://flask-gateway:8001';

// Socket.IO
const io = new Server(server, {
  cors: { origin: '*' },
});

io.of('/notifications').on('connection', (socket) => {
  console.log('Cliente conectado al namespace /notifications:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer en memoria para recibir multipart y reenviarlo al FastAPI
const upload = multer({ storage: multer.memoryStorage() });

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// GET /api/v1/dashboard/summary
app.get('/api/v1/dashboard/summary', async (_req: Request, res: Response) => {
  try {
    const [allDocsResp, recentDocsResp] = await Promise.allSettled([
      axios.get(`${FASTAPI_URL}/api/v1/documents/?page=1&limit=100`),
      axios.get(`${FASTAPI_URL}/api/v1/documents/?page=1&limit=5`),
    ]);

    const docsData = allDocsResp.status === 'fulfilled'
      ? allDocsResp.value.data
      : { total: 0, items: [] };

    const documents: Array<{ status: string }> = docsData.items ?? [];
    const total: number = docsData.total ?? 0;

    const uploaded  = documents.filter(d => d.status === 'UPLOADED').length;
    const processed = documents.filter(d => d.status === 'PROCESSED').length;

    const recentData = recentDocsResp.status === 'fulfilled'
      ? recentDocsResp.value.data.items
      : [];

    res.json({
      total_documents:  total,
      uploaded,
      processed,
      recent_documents: recentData,
    });

  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(502).json({ error: 'Could not fetch dashboard data' });
  }
});

// POST /api/v1/documents/upload
// Proxy multipart: recibe con multer y reenvía a FastAPI con form-data
app.post(
  '/api/v1/documents/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      const form = new FormData();
      form.append('file', req.file.buffer, {
        filename:    req.file.originalname,
        contentType: req.file.mimetype,
      });
      form.append('document_type', req.body.document_type ?? 'financial_report');

      const response = await axios.post(
        `${FASTAPI_URL}/api/v1/documents/upload`,
        form,
        { headers: form.getHeaders() }
      );

      res.json(response.data);
    } catch (err: any) {
      console.error('Upload error:', err.message);
      res.status(err.response?.status ?? 502).json({ error: 'Could not upload document' });
    }
  }
);

// GET /api/v1/documents
app.get('/api/v1/documents', async (req: Request, res: Response) => {
  try {
    const page  = req.query.page  ?? 1;
    const limit = req.query.limit ?? 10;
    const response = await axios.get(
      `${FASTAPI_URL}/api/v1/documents/?page=${page}&limit=${limit}`
    );
    res.json(response.data);
  } catch (err: any) {
    console.error('List documents error:', err.message);
    res.status(err.response?.status ?? 502).json({ error: 'Could not fetch documents' });
  }
});

// GET /api/v1/documents/:id
app.get('/api/v1/documents/:id', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      `${FASTAPI_URL}/api/v1/documents/${req.params.id}`
    );
    
    // Intentar traer compliance status del Flask gateway
    const complianceResp = await axios.get(
      `${FLASK_URL}/api/v1/compliance/status/${req.params.id}`
    ).catch(() => null); // Si no existe, continuar sin error

    res.json({
      ...response.data,
      compliance: complianceResp?.data || null
    });
  } catch (err: any) {
    console.error('Get document error:', err.message);
    res.status(err.response?.status ?? 502).json({ error: 'Could not fetch document' });
  }
});

// POST /api/v1/documents/:id/process
app.post('/api/v1/documents/:id/process', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      `${FASTAPI_URL}/api/v1/documents/${req.params.id}/process`
    );
    res.json(response.data);
  } catch (err: any) {
    console.error('Process document error:', err.message);
    res.status(err.response?.status ?? 502).json({ error: 'Could not process document' });
  }
});

// POST /api/v1/webhooks/processing-complete
app.post('/api/v1/webhooks/processing-complete', (req: Request, res: Response) => {
  const payload = req.body;
  console.log('Webhook recibido:', payload);

  io.of('/notifications').emit('processing-update', {
    document_id:       payload.document_id,
    filename:          payload.filename,
    document_status:   payload.document_status,
    compliance_status: payload.compliance_status,
    details:           payload.details,
    timestamp:         new Date().toISOString(),
  });

  res.json({ success: true, message: 'Notification emitted' });
});

// Arrancar servidor
const PORT = process.env.PORT ?? 4000;
server.listen(PORT, () => {
  console.log(`BFF corriendo en puerto ${PORT}`);
  console.log(`  FastAPI: ${FASTAPI_URL}`);
  console.log(`  Flask:   ${FLASK_URL}`);
});