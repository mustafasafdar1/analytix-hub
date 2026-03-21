const Papa = require('papaparse');

/**
 * Clean CSV data: remove nulls, NaN, empty rows, duplicates, trim whitespace
 * and compute statistics per column.
 */
function cleanCSV(csvString) {
  // Parse CSV
  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim()
  });

  const columns = parsed.meta.fields || [];
  let rows = parsed.data;
  const originalRows = rows.length;

  // --- 1. Remove entirely empty rows ---
  let emptyRowsRemoved = 0;
  rows = rows.filter((row) => {
    const allEmpty = columns.every((col) => {
      const v = row[col];
      return v === undefined || v === null || String(v).trim() === '';
    });
    if (allEmpty) emptyRowsRemoved++;
    return !allEmpty;
  });

  // --- 2. Replace null-like values with null ---
  const nullPatterns = ['null', 'nan', 'none', 'n/a', 'na', 'undefined', '-', '--', ''];
  let nullsRemoved = 0;

  rows = rows.map((row) => {
    const cleaned = {};
    columns.forEach((col) => {
      let val = row[col];
      if (val === undefined || val === null) {
        cleaned[col] = null;
        return;
      }
      const trimmed = String(val).trim();
      if (nullPatterns.includes(trimmed.toLowerCase())) {
        cleaned[col] = null;
      } else {
        cleaned[col] = trimmed;
      }
    });
    return cleaned;
  });

  // --- 3. Remove rows that have ANY null cell ---
  const beforeNullRemoval = rows.length;
  rows = rows.filter((row) => {
    return !columns.some((col) => row[col] === null);
  });
  nullsRemoved = beforeNullRemoval - rows.length;

  // --- 4. Remove duplicate rows ---
  const seen = new Set();
  const beforeDupRemoval = rows.length;
  rows = rows.filter((row) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const duplicatesRemoved = beforeDupRemoval - rows.length;

  // --- 5. Detect column types & cast numerics ---
  const columnTypes = {};
  columns.forEach((col) => {
    const sampleValues = rows.slice(0, Math.min(100, rows.length)).map((r) => r[col]).filter(Boolean);
    const numericCount = sampleValues.filter((v) => !isNaN(Number(v))).length;
    columnTypes[col] = numericCount > sampleValues.length * 0.7 ? 'numeric' : 'categorical';
  });

  // Cast numeric columns
  rows = rows.map((row) => {
    const casted = { ...row };
    columns.forEach((col) => {
      if (columnTypes[col] === 'numeric' && casted[col] !== null) {
        casted[col] = Number(casted[col]);
      }
    });
    return casted;
  });

  // --- 6. Compute statistics ---
  const statistics = {};
  columns.forEach((col) => {
    const values = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined);

    if (columnTypes[col] === 'numeric') {
      const nums = values.map(Number).filter((n) => !isNaN(n));
      if (nums.length === 0) {
        statistics[col] = { type: 'numeric', count: 0 };
        return;
      }
      const sorted = [...nums].sort((a, b) => a - b);
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / nums.length;
      const median =
        nums.length % 2 === 0
          ? (sorted[nums.length / 2 - 1] + sorted[nums.length / 2]) / 2
          : sorted[Math.floor(nums.length / 2)];
      const variance = nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / nums.length;
      const std = Math.sqrt(variance);

      statistics[col] = {
        type: 'numeric',
        count: nums.length,
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        std: Math.round(std * 100) / 100,
        sum: Math.round(sum * 100) / 100
      };
    } else {
      // Categorical — compute value counts
      const counts = {};
      values.forEach((v) => {
        const key = String(v);
        counts[key] = (counts[key] || 0) + 1;
      });
      // Top 10 values
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      statistics[col] = {
        type: 'categorical',
        count: values.length,
        unique: Object.keys(counts).length,
        topValues: sorted.map(([value, count]) => ({ value, count }))
      };
    }
  });

  return {
    columns,
    columnTypes,
    statistics,
    cleanedData: rows,
    summary: {
      originalRows,
      cleanedRows: rows.length,
      nullsRemoved,
      duplicatesRemoved,
      emptyRowsRemoved,
      totalRemoved: originalRows - rows.length
    }
  };
}

module.exports = { cleanCSV };
