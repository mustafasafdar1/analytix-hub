import { useLocation, useNavigate } from 'react-router-dom';
import CleaningSummary from '../components/CleaningSummary';
import ChartSection from '../components/ChartSection';
import DataTable from '../components/DataTable';
import ColumnStats from '../components/ColumnStats';
import ReportDownload from '../components/ReportDownload';

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data;

  if (!data) {
    return (
      <div>
        <nav className="navbar">
          <div className="navbar-brand" onClick={() => navigate('/')}>
            <div className="navbar-logo">D</div>
            <span className="navbar-title">DataLens</span>
          </div>
        </nav>
        <div className="loading-overlay">
          <p>No data available. Please upload a CSV file first.</p>
          <button className="back-btn" onClick={() => navigate('/')} style={{ marginTop: 20 }}>
            ← Go to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="navbar-logo">D</div>
          <span className="navbar-title">DataLens</span>
        </div>
        <div className="navbar-links">
          <button className="navbar-link" onClick={() => navigate('/')}>
            ← New Upload
          </button>
        </div>
      </nav>

      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <h2>📊 Analysis Results</h2>
          <span className="filename-badge">📁 {data.filename}</span>
        </div>

        {/* Cleaning Summary Cards */}
        <CleaningSummary data={data} />

        {/* Column Statistics Table */}
        <div className="section-header">
          <span className="section-icon">📋</span>
          <h3>Column Statistics</h3>
        </div>
        <ColumnStats columns={data.columns} columnTypes={data.columnTypes} statistics={data.statistics} />

        {/* Charts */}
        <div className="section-header">
          <span className="section-icon">📈</span>
          <h3>Data Visualizations</h3>
        </div>
        <ChartSection columns={data.columns} columnTypes={data.columnTypes} statistics={data.statistics} cleanedData={data.cleanedData} />

        {/* Data Preview Table */}
        <div className="section-header">
          <span className="section-icon">🔍</span>
          <h3>Cleaned Data Preview</h3>
        </div>
        <DataTable columns={data.columns} data={data.cleanedData} />

        {/* Report Download */}
        <ReportDownload data={data} />
      </div>
    </div>
  );
}

export default Dashboard;
