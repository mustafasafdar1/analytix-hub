import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CleaningSummary from '../components/CleaningSummary';
import ChartSection from '../components/ChartSection';
import DataTable from '../components/DataTable';
import ColumnStats from '../components/ColumnStats';
import CorrelationMatrix from '../components/CorrelationMatrix';
import ReportDownload from '../components/ReportDownload';

function Dashboard({ theme, toggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data;
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) {
    return (
      <div>
        <nav className="navbar">
          <div className="navbar-brand" onClick={() => navigate('/')}>
            <div className="navbar-logo-icon">A</div>
            <span className="navbar-title">AnalytixHub</span>
          </div>
        </nav>
        <div className="loading-overlay">
          <p>No data available. Upload a CSV file first.</p>
          <button className="back-btn" onClick={() => navigate('/')} style={{ marginTop: 20 }}>← Go to Upload</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'charts', label: '📈 Charts' },
    { id: 'correlation', label: '🔗 Correlation' },
    { id: 'data', label: '🔍 Data' },
    { id: 'export', label: '📥 Export' },
  ];

  const hasCorrelation = data.correlationMatrix && Object.keys(data.correlationMatrix).length > 0;

  const downloadCSV = () => {
    const cols = data.columns || [];
    const rows = data.cleanedData || [];
    let csv = cols.join(',') + '\n';
    rows.forEach(row => {
      csv += cols.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? '"' + str.replace(/"/g, '""') + '"' : str;
      }).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (data.filename || 'data').replace('.csv', '') + '_cleaned.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="navbar-logo-icon">A</div>
          <span className="navbar-title">AnalytixHub</span>
        </div>
        <div className="navbar-links">
          <button className="navbar-link" onClick={downloadCSV}>📥 Download CSV</button>
          <button className="navbar-link" onClick={() => navigate('/')}>← New Upload</button>
          <button className="navbar-link" onClick={() => navigate('/history')}>History</button>
          <button className="theme-toggle" onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
      </nav>

      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Analysis Results</h2>
          <span className="filename-badge">📁 {data.filename}</span>
        </div>

        <div className="dashboard-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            <CleaningSummary data={data} />

            {data.analysis?.descriptive && (
              <>
                <div className="section-header">
                  <span className="section-icon">📝</span>
                  <h3>Descriptive Analysis — What Happened</h3>
                </div>
                <div className="conclusion-card" style={{ whiteSpace: 'pre-line' }}>{data.analysis.descriptive}</div>
              </>
            )}

            {data.analysis?.predictive && (
              <>
                <div className="section-header">
                  <span className="section-icon">🔮</span>
                  <h3>Predictive Analysis — What Could Happen</h3>
                </div>
                <div className="conclusion-card" style={{ whiteSpace: 'pre-line', borderLeftColor: 'var(--accent-5)' }}>{data.analysis.predictive}</div>
              </>
            )}

            {data.analysis?.prescriptive && (
              <>
                <div className="section-header">
                  <span className="section-icon">💡</span>
                  <h3>Prescriptive Analysis — What To Do</h3>
                </div>
                <div className="conclusion-card" style={{ whiteSpace: 'pre-line', borderLeftColor: 'var(--accent-4)' }}>{data.analysis.prescriptive}</div>
              </>
            )}

            {!data.analysis?.descriptive && data.conclusion && (
              <>
                <div className="section-header">
                  <span className="section-icon">💡</span>
                  <h3>Conclusion</h3>
                </div>
                <div className="conclusion-card">{data.conclusion}</div>
              </>
            )}

            <div className="section-header">
              <span className="section-icon">📋</span>
              <h3>Column Statistics</h3>
            </div>
            <ColumnStats columns={data.columns} columnTypes={data.columnTypes} statistics={data.statistics} />

            {data.outlierSummary && Object.keys(data.outlierSummary).length > 0 && (
              <>
                <div className="section-header">
                  <span className="section-icon">⚠️</span>
                  <h3>Outlier Detection</h3>
                </div>
                <div className="outlier-card">
                  {Object.entries(data.outlierSummary).map(([col, info]) => (
                    <div className="outlier-item" key={col}>
                      <span><strong>{col}</strong> — {info.percentage}% outliers</span>
                      <span className="outlier-count">{info.count} values outside [{info.bounds?.lower}, {info.bounds?.upper}]</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'charts' && (
          <>
            <div className="section-header">
              <span className="section-icon">📈</span>
              <h3>Data Visualizations</h3>
            </div>
            <ChartSection columns={data.columns} columnTypes={data.columnTypes}
              statistics={data.statistics} cleanedData={data.cleanedData} />
          </>
        )}

        {activeTab === 'correlation' && (
          <>
            <div className="section-header">
              <span className="section-icon">🔗</span>
              <h3>Correlation Analysis</h3>
            </div>
            {hasCorrelation ? (
              <CorrelationMatrix correlationMatrix={data.correlationMatrix}
                columns={data.columns} columnTypes={data.columnTypes} />
            ) : (
              <div className="conclusion-card">Need at least 2 numeric columns for correlation analysis.</div>
            )}
          </>
        )}

        {activeTab === 'data' && (
          <>
            <div className="section-header">
              <span className="section-icon">🔍</span>
              <h3>Cleaned Data Preview</h3>
            </div>
            <DataTable columns={data.columns} data={data.cleanedData} />
          </>
        )}

        {activeTab === 'export' && (
          <ReportDownload data={data} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
