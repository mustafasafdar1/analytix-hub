function ColumnStats({ columns, columnTypes, statistics }) {
  return (
    <div className="stats-table-wrapper">
      <table className="stats-table">
        <thead>
          <tr>
            <th>Column</th>
            <th>Type</th>
            <th>Count</th>
            <th>Mean</th>
            <th>Median</th>
            <th>Min</th>
            <th>Max</th>
            <th>Std Dev</th>
            <th>Unique</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col) => {
            const stat = statistics[col] || {};
            const type = columnTypes[col] || 'unknown';
            return (
              <tr key={col}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{col}</td>
                <td>
                  <span className={`type-badge ${type}`}>{type}</span>
                </td>
                <td>{stat.count ?? '—'}</td>
                <td>{stat.mean !== undefined ? stat.mean : '—'}</td>
                <td>{stat.median !== undefined ? stat.median : '—'}</td>
                <td>{stat.min !== undefined ? stat.min : '—'}</td>
                <td>{stat.max !== undefined ? stat.max : '—'}</td>
                <td>{stat.std !== undefined ? stat.std : '—'}</td>
                <td>{stat.unique !== undefined ? stat.unique : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ColumnStats;
