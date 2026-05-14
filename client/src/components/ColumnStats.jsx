import { useState } from 'react';

function ColumnStats({ columns, columnTypes, statistics }) {
  const [expanded, setExpanded] = useState(null);

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
            <th>Outliers</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col) => {
            const stat = statistics[col] || {};
            const type = columnTypes[col] || 'unknown';
            const isExpanded = expanded === col;
            return (
              <>
                <tr key={col} onClick={() => setExpanded(isExpanded ? null : col)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isExpanded ? '▾' : '▸'} {col}
                  </td>
                  <td><span className={`type-badge ${type}`}>{type === 'numeric' ? '# ' : '⊞ '}{type}</span></td>
                  <td>{stat.count ?? '—'}</td>
                  <td>{stat.mean !== undefined ? stat.mean : '—'}</td>
                  <td>{stat.median !== undefined ? stat.median : '—'}</td>
                  <td>{stat.min !== undefined ? stat.min : '—'}</td>
                  <td>{stat.max !== undefined ? stat.max : '—'}</td>
                  <td>{stat.std !== undefined ? stat.std : '—'}</td>
                  <td>{stat.unique !== undefined ? stat.unique : '—'}</td>
                  <td>
                    {stat.outlierCount > 0
                      ? <span className="outlier-count">{stat.outlierCount}</span>
                      : '—'}
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${col}-detail`}>
                    <td colSpan={10} style={{ background: 'var(--bg-hover)', padding: '14px 20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', fontSize: '12px' }}>
                        {stat.type === 'numeric' && (
                          <>
                            <div><strong>Q1:</strong> {stat.q1 ?? '—'}</div>
                            <div><strong>Q3:</strong> {stat.q3 ?? '—'}</div>
                            <div><strong>IQR:</strong> {stat.iqr ?? '—'}</div>
                            <div><strong>Skewness:</strong> {stat.skewness ?? '—'}</div>
                            <div><strong>Kurtosis:</strong> {stat.kurtosis ?? '—'}</div>
                            <div><strong>Sum:</strong> {stat.sum?.toLocaleString() ?? '—'}</div>
                            <div><strong>Completeness:</strong> {stat.completeness ?? '—'}%</div>
                            {stat.outlierCount > 0 && (
                              <div><strong>Outlier Bounds:</strong> [{stat.outlierBounds?.lower}, {stat.outlierBounds?.upper}]</div>
                            )}
                          </>
                        )}
                        {stat.type === 'categorical' && (
                          <>
                            <div><strong>Completeness:</strong> {stat.completeness ?? '—'}%</div>
                            <div><strong>Unique Values:</strong> {stat.unique}</div>
                            {stat.topValues?.slice(0, 5).map((tv, i) => (
                              <div key={i}><strong>#{i + 1}:</strong> {tv.value} ({tv.count})</div>
                            ))}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ColumnStats;
