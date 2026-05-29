import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useNotifications } from './hooks/useNotifications';
import DocumentsPage from './pages/DocumentsPage';
import PageDetail from './pages/PageDetail';

function App() {
  const { notifications } = useNotifications();

  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        {/* Navigation */}
        <nav style={styles.navbar}>
          <div style={styles.navContent}>
            <Link to="/" style={styles.navBrand}>
              📋 Compliance Platform
            </Link>
            <div style={styles.navLinks}>
              <Link to="/" style={styles.navLink}>Dashboard</Link>
              <Link to="/documents" style={styles.navLink}>Documentos</Link>
            </div>
          </div>
        </nav>

        {/* Notifications */}
        <div style={styles.notificationsContainer}>
          {notifications.map(notif => (
            <div key={notif.id} style={styles.notification}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {notif.filename}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Estado: <strong>{notif.document_status}</strong>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Compliance: <strong>{notif.compliance_status}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                {notif.details}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/:id" element={<PageDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function DashboardPage() {
  const [summary, setSummary] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    try {
      const response = await fetch('http://localhost:4000/api/v1/dashboard/summary');
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Cargando...</div>;
  if (!summary) return <div>No se pudo cargar el dashboard</div>;

  return (
    <div>
      <h1 style={styles.pageTitle}>Dashboard</h1>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <StatCard label="Total de documentos" value={summary.total_documents} color="#3b82f6" />
        <StatCard label="Uploadados" value={summary.uploaded} color="#f59e0b" />
        <StatCard label="Procesados" value={summary.processed} color="#10b981" />
      </div>

      {/* Recent Documents */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Últimos documentos</h2>
        {summary.recent_documents?.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No hay documentos aún</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {summary.recent_documents?.map((doc: any) => (
                <tr key={doc.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <Link to={`/documents/${doc.id}`} style={styles.link}>
                      {doc.filename}
                    </Link>
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,.1)',
    padding: '0 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navContent: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
  },
  navBrand: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111',
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
  },
  navLink: {
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '2rem',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: '2rem',
    color: '#111',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,.1)',
    marginBottom: '2rem',
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 16,
    color: '#111',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  tableHeader: {
    background: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
  },
  th: {
    padding: '12px',
    textAlign: 'left' as const,
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '12px',
    fontSize: 14,
    color: '#111',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: 500,
  },
  notificationsContainer: {
    position: 'fixed' as const,
    top: 80,
    right: 20,
    width: 360,
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto' as const,
    zIndex: 50,
  },
  notification: {
    background: '#fff',
    borderLeft: '4px solid #10b981',
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,.15)',
    animation: 'slideIn 0.3s ease-out',
  },
};

export default App;