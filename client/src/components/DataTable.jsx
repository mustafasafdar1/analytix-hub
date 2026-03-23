function DataTable({ columns, data }) {
  const previewRows = data.slice(0, 30);

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewRows.map((row, i) => (
            <tr key={i}>
              <td className="row-num">{i + 1}</td>
              {columns.map((col) => (
                <td key={col} title={String(row[col] ?? '')}>
                  {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 30 && (
        <p style={{ textAlign: 'center', padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>
          Showing 30 of {data.length.toLocaleString()} rows
        </p>
      )}
    </div>
  );
}

export default DataTable;
