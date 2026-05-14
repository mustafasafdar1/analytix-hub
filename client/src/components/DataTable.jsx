import { useState, useMemo } from 'react';

function DataTable({ columns, data }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const perPage = 50;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => String(row[col] ?? '').toLowerCase().includes(q))
    );
  }, [data, columns, search]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortCol], vb = b[sortCol];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va), sb = String(vb);
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageData = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxShow = 5;
    let start = Math.max(1, currentPage - Math.floor(maxShow / 2));
    let end = Math.min(totalPages, start + maxShow - 1);
    if (end - start < maxShow - 1) start = Math.max(1, end - maxShow + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="data-table-container">
      <div className="table-toolbar">
        <input
          type="text"
          className="table-search"
          placeholder="🔍 Search across all columns..."
          value={search}
          onChange={handleSearch}
        />
        <span className="table-info">
          {search ? `${sorted.length} of ${data.length}` : data.length.toLocaleString()} rows
          {sortCol && ` • Sorted by ${sortCol}`}
        </span>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={sortCol === col ? 'sorted' : ''}
                >
                  {col}
                  <span className="sort-icon">
                    {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i}>
                <td className="row-num">{(currentPage - 1) * perPage + i + 1}</td>
                {columns.map(col => (
                  <td key={col} title={String(row[col] ?? '')}>
                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                  {search ? 'No matching rows found' : 'No data available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(1)} disabled={currentPage === 1}>«</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
          {getPageNumbers().map(p => (
            <button key={p} className={p === currentPage ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
          <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>»</button>
        </div>
      )}
    </div>
  );
}

export default DataTable;
