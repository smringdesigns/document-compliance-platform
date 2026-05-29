import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DocumentDetail, getDocument, processDocument } from '../api';

const COMPLIANCE_COLORS: Record<string, string> = {
  COMPLIANT:     '#10b981',
  NON_COMPLIANT: '#ef4444',
};

export default function PageDetail() {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const [doc, setDoc]           = useState<DocumentDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!id) return;
    loadDocument();
  }, [id]);

  async function loadDocument() {
    setLoading(true);
    try {
      const res = await getDocument(id!);
      setDoc(res.data);
    } catch {
      setError('No se pudo cargar el documento.');
    } finally {
      setLoading(false);
    }
  }

  async function handleProcess() {
    if (!id) return;
    setProcessing(true);
    try {
      await processDocument(id);
      await loadDocument(); // Recargar para ver el nuevo estado
    } catch {
      setError('Error al procesar el documento.');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <div style={styles.page}><p>Cargando...</p></div>;
  if (error)   return <div style={styles.page}><p style={{ color: '#ef4444' }}>{error}</p></div>;
  if (!doc)    return null;

  return (
    <div style={styles.page}>
      <button style={styles.back} onClick={() => navigate('/')}>← Volver</button>

      {/* Metadata del documento */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Documento</h2>
        <div style={styles.grid}>
          <Field label="Nombre"   value={doc.filename} />
          <Field label="Tipo"     value={doc.document_type} />
          <Field label="Estado"   value={doc.status} highlight />
          <Field label="Ruta"     value={doc.storage_path} />
          <Field label="Creado"   value={new Date(doc.created_at).toLocaleString()} />
        </div>

        {doc.status === 'UPLOADED' && (
          <button
            style={{ ...styles.btn, marginTop: 20, opacity: processing ? 0.6 : 1 }}
            disabled={processing}
            onClick={handleProcess}
          >
            {processing ? 'Procesando...' : 'Verificar compliance'}
          </button>
        )}
      </section>

      {/* Resultado de compliance */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Resultado de compliance</h2>

        {!doc.compliance ? (
          <p style={{ color: '#6b7280' }}>
            Este documento aún no ha sido verificado.
          </p>
        ) : (
          <div>
            {/* Badge grande de resultado */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 8,
              background: COMPLIANCE_COLORS[doc.compliance.status] ?? '#6b7280',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 20,
            }}>
              {doc.compliance.status === 'COMPLIANT' ? '✓' : '✗'} {doc.compliance.status}
            </div>

            <div style={styles.grid}>
              <Field label="Detalles"    value={doc.compliance.details} />
              <Field label="Verificado"  value={new Date(doc.compliance.checked_at).toLocaleString()} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, color: highlight ? '#3b82f6' : '#111', fontWeight: highlight ? 600 : 400 }}>
        {value}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:      { maxWidth: 700, margin: '0 auto', padding: '2rem' },
  back:      { background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 14, marginBottom: 16, padding: 0 },
  card:      { background: '#fff', borderRadius: 8, padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,.1)' },
  cardTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: '#111' },
  grid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' },
  btn:       { padding: '10px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: 14 },
};
