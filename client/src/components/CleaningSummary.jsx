function CleaningSummary({ data }) {
  const stats = [
    {
      icon: '📁',
      value: data.originalRows?.toLocaleString() || 0,
      label: 'Original Rows'
    },
    {
      icon: '✅',
      value: data.cleanedRows?.toLocaleString() || 0,
      label: 'Clean Rows'
    },
    {
      icon: '🚫',
      value: data.nullsRemoved?.toLocaleString() || 0,
      label: 'Nulls / NaN Removed'
    },
    {
      icon: '🔄',
      value: data.duplicatesRemoved?.toLocaleString() || 0,
      label: 'Duplicates Removed'
    },
    {
      icon: '📊',
      value: data.columns?.length || 0,
      label: 'Columns Detected'
    }
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, i) => (
        <div className="stat-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="stat-icon">{stat.icon}</div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export default CleaningSummary;
