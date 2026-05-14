import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function History({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/upload');
      setUploads(res.data);
      setLoading(false);
    } catch {
      setError('Could not load history. Is the server running?');
      setLoading(false);
    }
  };

  const handleRowClick = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/upload/${id}`);
      navigate('/dashboard', { state: { data: res.data } });
    } catch { alert('Error loading analysis'); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this analysis?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/upload/${id}`);
      setUploads(prev => prev.filter(u => u._id !== id));
    } catch { alert('Error deleting'); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const filtered = uploads
    .filter(u => !search || u.filename.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.filename.localeCompare(b.filename);
      if (sortBy === 'rows') return (b.originalRows || 0) - (a.originalRows || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="navbar-logo-icon">A</div>
          <span className="navbar-title">AnalytixHub</span>
        </div>
        <div className="navbar-links">
          <button className="navbar-link" onClick={() => navigate('/')}>Upload</button>
          <button className="navbar-link active">History</button>
          <button className="theme-toggle" onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h2>📚 Analysis History</h2>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner"></div><p>Loading history...</p></div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : uploads.length === 0 ? (
          <div className="report-section">
            <h3>No reports yet</h3>
            <p>Upload your first CSV to get started.</p>
            <button className="upload-btn" onClick={() => navigate('/')} style={{ maxWidth: 250, margin: '20px auto' }}>Upload CSV</button>
          </div>
        ) : (
          <>
            <div className="table-toolbar">
              <input type="text" className="table-search" placeholder="🔍 Search by filename..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <div style={{ display: 'flex', gap: 6 }}>
                {['date', 'name', 'rows'].map(s => (
                  <button key={s} className={`tab-btn ${sortBy === s ? 'active' : ''}`}
                    onClick={() => setSortBy(s)} style={{ padding: '5px 12px', fontSize: 11 }}>
                    {s === 'date' ? '📅 Date' : s === 'name' ? '📄 Name' : '📊 Rows'}
                  </button>
                ))}
              </div>
            </div>

            <div className="stats-table-wrapper" style={{ marginTop: 12 }}>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Date</th>
                    <th>Original</th>
                    <th>Cleaned</th>
                    <th>Quality</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(up => {
                    const eff = up.originalRows > 0 ? ((up.cleanedRows / up.originalRows) * 100).toFixed(1) : '100';
                    return (
                      <tr key={up._id} onClick={() => handleRowClick(up._id)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📄 {up.filename}</td>
                        <td>{formatDate(up.createdAt)}</td>
                        <td>{(up.originalRows || 0).toLocaleString()}</td>
                        <td>{(up.cleanedRows || 0).toLocaleString()}</td>
                        <td>
                          <span className={`type-badge ${parseFloat(eff) > 90 ? 'numeric' : 'categorical'}`}>
                            {eff}%
                          </span>
                        </td>
                        <td>
                          <button className="navbar-link" style={{ padding: '4px 12px', fontSize: 11, marginRight: 6 }}>
                            View →
                          </button>
                          <button className="navbar-link" style={{ padding: '4px 10px', fontSize: 11 }}
                            onClick={(e) => handleDelete(e, up._id)}>🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default History;
