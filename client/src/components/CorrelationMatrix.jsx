function CorrelationMatrix({ correlationMatrix, columns, columnTypes }) {
  const numCols = columns.filter(c => columnTypes[c] === 'numeric');

  if (!correlationMatrix || numCols.length < 2) {
    return null;
  }

  const getCellColor = (val) => {
    if (val === 1) return 'rgba(99,102,241,0.3)';
    if (val >= 0.7) return 'rgba(6,214,160,0.5)';
    if (val >= 0.4) return 'rgba(6,214,160,0.25)';
    if (val >= 0) return 'rgba(6,214,160,0.08)';
    if (val >= -0.4) return 'rgba(244,114,182,0.08)';
    if (val >= -0.7) return 'rgba(244,114,182,0.25)';
    return 'rgba(244,114,182,0.5)';
  };

  const getTextColor = (val) => {
    if (Math.abs(val) >= 0.7) return '#fff';
    return 'var(--text-secondary)';
  };

  return (
    <div className="correlation-container">
      <h4 style={{ marginBottom: 4, fontSize: 15, fontWeight: 600 }}>Correlation Matrix</h4>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
        Pearson correlation coefficients between numeric columns
      </p>
      <div style={{ overflowX: 'auto' }}>
        <div className="correlation-grid" style={{
          gridTemplateColumns: `100px repeat(${numCols.length}, 56px)`,
          gridTemplateRows: `32px repeat(${numCols.length}, 56px)`
        }}>
          <div></div>
          {numCols.map(col => (
            <div key={`h-${col}`} className="corr-header" title={col}>
              {col.length > 7 ? col.slice(0, 6) + '…' : col}
            </div>
          ))}
          {numCols.map(rowCol => (
            <>
              <div key={`r-${rowCol}`} className="corr-header" style={{ justifyContent: 'flex-end', paddingRight: 8 }} title={rowCol}>
                {rowCol.length > 12 ? rowCol.slice(0, 11) + '…' : rowCol}
              </div>
              {numCols.map(colCol => {
                const val = correlationMatrix[rowCol]?.[colCol] ?? 0;
                return (
                  <div
                    key={`${rowCol}-${colCol}`}
                    className="corr-cell"
                    style={{ background: getCellColor(val), color: getTextColor(val) }}
                    title={`${rowCol} × ${colCol}: r = ${val}`}
                  >
                    {val.toFixed(2)}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 10, color: 'var(--text-muted)' }}>
        <span>🟢 Strong positive (&gt;0.7)</span>
        <span>⚪ Weak (±0.4)</span>
        <span>🔴 Strong negative (&lt;-0.7)</span>
      </div>
    </div>
  );
}

export default CorrelationMatrix;
