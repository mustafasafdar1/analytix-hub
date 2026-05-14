import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

function FileUpload({ onUpload, uploading, progress, error }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setValidationError('');
    if (rejectedFiles?.length > 0) {
      const err = rejectedFiles[0].errors?.[0];
      if (err?.code === 'file-too-large') setValidationError('File exceeds 200MB limit.');
      else if (err?.code === 'file-invalid-type') setValidationError('Only CSV files are supported.');
      else setValidationError('Invalid file.');
      return;
    }
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    multiple: false,
    disabled: uploading,
    maxSize: 200 * 1024 * 1024
  });

  const handleSubmit = () => {
    if (selectedFile) onUpload(selectedFile);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="upload-section">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} id="csv-dropzone">
        <input {...getInputProps()} />
        <div className="dropzone-icon">{isDragActive ? '📥' : '📂'}</div>
        <h3>{isDragActive ? 'Drop your CSV here...' : 'Drag & drop your CSV file here'}</h3>
        <p>or <span className="browse-btn">browse files</span> • Up to 200MB</p>
        {selectedFile && (
          <div className="file-info">📄 {selectedFile.name} ({formatSize(selectedFile.size)})</div>
        )}
      </div>

      {(error || validationError) && (
        <div className="error-message">⚠️ {error || validationError}</div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-text">
            {progress < 90 ? `Uploading... ${progress}%`
              : progress < 100 ? 'Analyzing & cleaning data...'
              : '✅ Complete! Redirecting...'}
          </div>
        </div>
      )}

      <button className="upload-btn" onClick={handleSubmit} disabled={!selectedFile || uploading} id="upload-button">
        {uploading ? '⏳ Processing...' : '🚀 Upload & Analyze'}
      </button>
    </div>
  );
}

export default FileUpload;
