import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';

function Home({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async (file) => {
    setUploading(true);
    setError('');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 90));
        }
      });

      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', 'http://localhost:5000/api/upload');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.timeout = 300000; // 5 min timeout for large files

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error || 'Upload failed'));
            } catch {
              reject(new Error(`Server error (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error. Is the server running?'));
        xhr.ontimeout = () => reject(new Error('Upload timed out. File may be too large.'));
        xhr.send(formData);
      });

      setTimeout(() => {
        navigate('/dashboard', { state: { data: response } });
      }, 400);
    } catch (err) {
      setError(err.message);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="navbar-logo-icon">A</div>
          <span className="navbar-title">AnalytixHub</span>
        </div>
        <div className="navbar-links">
          <button className="navbar-link active">Upload</button>
          <button className="navbar-link" onClick={() => navigate('/history')}>History</button>
          <button className="theme-toggle" onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
      </nav>

      <section className="hero">
        <h1>Smart Data Cleaning &amp; Analytics Dashboard</h1>
        <p>
          Upload any CSV file — we automatically clean nulls, duplicates, and invalid data,
          then generate interactive charts, statistics, and downloadable reports.
        </p>
      </section>

      <FileUpload onUpload={handleUpload} uploading={uploading} progress={progress} error={error} />

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🧹</div>
          <h3>Smart Cleaning</h3>
          <p>Auto-removes nulls, NaN, duplicates, empty rows. Handles files up to 200MB.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Rich Visualizations</h3>
          <p>Bar charts, pie charts, area plots, scatter plots, and correlation heatmaps.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📥</div>
          <h3>Export Everything</h3>
          <p>Download cleaned CSV files and comprehensive PDF reports with full analytics.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
