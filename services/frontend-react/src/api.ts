import axios from 'axios';

// En Docker el BFF corre en :4000. En desarrollo local apunta al mismo puerto.
const BASE = 'http://localhost:4000/api/v1';

const api = axios.create({ baseURL: BASE });

// Tipos

export interface Document {
  id:            string;
  filename:      string;
  document_type: string;
  status:        string;
  created_at:    string;
}

export interface ComplianceCheck {
  status:     string;
  details:    string;
  checked_at: string;
}

export interface DocumentDetail extends Document {
  storage_path: string;
  compliance:   ComplianceCheck | null;
}

export interface DocumentsPage {
  total: number;
  page:  number;
  limit: number;
  items: Document[];
}

export interface DashboardSummary {
  total_documents:  number;
  uploaded:         number;
  processed:        number;
  recent_documents: Document[];
}

// ── Llamadas al BFF ──────────────────────────────────────────────────────────

export const uploadDocument = (file: File, documentType: string) => {
  const form = new FormData();
  form.append('file', file);
  form.append('document_type', documentType);
  // Upload a través del BFF
  return api.post('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getDocuments = (page = 1, limit = 10) =>
  api.get<DocumentsPage>(`/documents?page=${page}&limit=${limit}`);

export const getDocument = (id: string) =>
  api.get<DocumentDetail>(`/documents/${id}`);

export const processDocument = (id: string) =>
  api.post(`/documents/${id}/process`);

export const getDashboardSummary = () =>
  api.get<DashboardSummary>('/dashboard/summary');