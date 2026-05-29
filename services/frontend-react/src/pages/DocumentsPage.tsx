import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { uploadDocument, getDocuments, Document } from '../api';

export default function DocumentsPage() {
  const [docs, setDocs]       = useState<Document[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);

  const [file, setFile]               = useState<File | null>(null);
  const [docType, setDocType]         = useState('financial_report');
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const limit = 10;

  useEffect(() => {
    fetchDocs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchDocs() {
    setLoading(true);
    try {
      const { data } = await getDocuments(page, limit);
      setDocs(data.items);
      setTotal(data.total);
    } catch {
      console.error('Error cargando documentos');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      await uploadDocument(file, docType);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setPage(1);
      await fetchDocs();
    } catch {
      setUploadError('Error al subir el documento. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div>
      <h1 style={styles.pageTitle}>Documentos</h1>

      {/* Formulario de upload */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Subir documento</h2>
        <form onSubmit={handleUpload}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Archivo</label>
            <input
              ref={fileRef}
              type="file"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tipo de documento</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} style={styles.input}>
              <option value="financial_report">Financial Report</option>
              <option value="tax_filing">Tax Filing</option>
              <option value="regulatory_disclosure">Regulatory Disclosure</option>
            </select>
          </div>
          {uploadError && <p style={styles.error}>{uploadError}</p>}
          <button
            type="submit"
            disabled={uploading || !file}
            style={{
              ...styles.button,
              opacity: uploading || !file ? 0.6 : 1,
              cursor: uploading || !file ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? 'Subiendo...' : 'Subir documento'}
          </button>
        </form>
      </div>

      {/* Lista de documentos */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Mis documentos ({total})</h2>

        {loading && <p>Cargando...</p>}

        {!loading && docs.length === 0 && (
          <p style={{ color: '#6b7280' }}>No hay documentos aún. Sube uno arriba.</p>
        )}

        {!loading && docs.length > 0 && (
          <>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} style={styles.tableRow}>
                    <td style={styles.td}>{doc.filename}</td>
                    <td style={styles.td}>{doc.document_type}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: doc.status === 'PROCESSED' ? '#d1fae5' : '#fef08a',
                        color: doc.status === 'PROCESSED' ? '#047857' : '#92400e',
                      }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <Link to={`/documents/${doc.id}`} style={styles.link}>
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ ...styles.paginationButton, opacity: page === 1 ? 0.5 : 1 }}
                >
                  ← Anterior
                </button>
                <span style={styles.pageInfo}>
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ ...styles.paginationButton, opacity: page === totalPages ? 0.5 : 1 }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  pageTitle:        { fontSize: 28, fontWeight: 700, marginBottom: '2rem', color: '#111' },
  card:             { background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,.1)', marginBottom: '2rem' },
  cardTitle:        { margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: '#111' },
  formGroup:        { marginBottom: 16 },
  label:            { display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#111' },
  input:            { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' as const },
  button:           { padding: '10px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, fontSize: 14 },
  error:            { color: '#ef4444', fontSize: 14, marginBottom: 12 },
  table:            { width: '100%', borderCollapse: 'collapse' as const },
  tableHeader:      { background: '#f9fafb', borderBottom: '2px solid #e5e7eb' },
  th:               { padding: '12px', textAlign: 'left' as const, fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' },
  tableRow:         { borderBottom: '1px solid #e5e7eb' },
  td:               { padding: '12px', fontSize: 14, color: '#111' },
  link:             { color: '#3b82f6', textDecoration: 'none', fontWeight: 500 },
  pagination:       { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' },
  paginationButton: { padding: '8px 16px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  pageInfo:         { fontSize: 14, color: '#6b7280' },
};