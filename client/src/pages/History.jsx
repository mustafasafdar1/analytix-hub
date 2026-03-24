import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function History() {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/upload');
      setUploads(response.data);
      setLoading(false);
    } catch (err) {
      setError('Could not load history. Make sure the server is running.');
      setLoading(false);
    }
  };

  const handleRowClick = async (id) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/upload/${id}`);
      navigate('/dashboard', { state: { data: response.data } });
    } catch (err) {
      alert('Error loading analysis detail');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="navbar-logo">D</div>
          <span className="navbar-title">DataLens</span>
        </div>
        <div className="navbar-links">
          <button className="navbar-link" onClick={() => navigate('/')}>Home</button>
          <button className="navbar-link active">History</button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h2>📚 Analysis History</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Recall insights from your previous datasets</p>
        </div>

        {loading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading your history...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : uploads.length === 0 ? (
          <div className="report-section">
            <h3>No reports found</h3>
            <p>Upload your first CSV file to start building your history.</p>
            <button className="upload-btn" onClick={() => navigate('/')} style={{ maxWidth: 250, margin: '20px auto' }}>
              Upload CSV
            </button>
          </div>
        ) : (
          <div className="stats-table-wrapper" style={{ marginTop: 20 }}>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Upload Date</th>
                  <th>Orig. Rows</th>
                  <th>Clean Rows</th>
                  <th>Efficiency</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((up) => {
                  const efficiency = ((up.cleanedRows / up.originalRows) * 100).toFixed(1);
                  return (
                    <tr key={up._id} onClick={() => handleRowClick(up._id)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>📄 {up.filename}</td>
                      <td>{formatDate(up.createdAt)}</td>
                      <td>{up.originalRows.toLocaleString()}</td>
                      <td>{up.cleanedRows.toLocaleString()}</td>
                      <td>
                        <span className={`type-badge ${efficiency > 90 ? 'numeric' : 'categorical'}`}>
                          {efficiency}%
                        </span>
                      </td>
                      <td>
                        <button className="navbar-link" style={{ padding: '4px 12px', fontSize: 12 }}>
                          View Report →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
