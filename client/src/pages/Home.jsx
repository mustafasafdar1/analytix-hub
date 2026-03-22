import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';

function Home() {
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

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            resolve(JSON.parse(xhr.responseText));
          } else {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error || 'Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      });

      // Small delay so user sees 100%
      setTimeout(() => {
        navigate('/dashboard', { state: { data: response } });
      }, 500);
    } catch (err) {
      setError(err.message);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="navbar-logo">D</div>
          <span className="navbar-title">DataLens</span>
        </div>
        <div className="navbar-links">
          <button className="navbar-link active">Upload</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <span className="hero-badge">⚡ Powered by Intelligent Analytics</span>
        <h1>
          Transform Raw Data Into
          <br />
          <span className="gradient-text">Powerful Insights</span>
        </h1>
        <p>
          Upload your CSV file and let our AI-powered engine auto-clean your data,
          remove null & NaN values, generate stunning visualizations, and produce
          comprehensive reports — all in seconds.
        </p>
      </section>

      {/* Upload */}
      <FileUpload
        onUpload={handleUpload}
        uploading={uploading}
        progress={progress}
        error={error}
      />

      {/* Features */}
      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🧹</div>
          <h3>Auto Data Cleaning</h3>
          <p>Automatically removes null values, NaN entries, duplicates, and empty rows from your dataset.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Smart Visualizations</h3>
          <p>Generates intelligent charts based on your data types — bar charts, area charts, and more.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📄</div>
          <h3>PDF Reports</h3>
          <p>Download a comprehensive analysis report with statistics, cleaning summary, and insights.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
