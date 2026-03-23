import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ReportDownload({ data }) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(108, 92, 231);
    doc.text('DataLens Analysis Report', pageWidth / 2, 25, { align: 'center' });

    // Filename & date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`File: ${data.filename}`, 14, 40);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 47);

    // Cleaning Summary
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Data Cleaning Summary', 14, 62);

    doc.autoTable({
      startY: 67,
      head: [['Metric', 'Value']],
      body: [
        ['Original Rows', String(data.originalRows || 0)],
        ['Cleaned Rows', String(data.cleanedRows || 0)],
        ['Rows Removed', String((data.originalRows || 0) - (data.cleanedRows || 0))],
        ['Null/NaN Values Removed', String(data.nullsRemoved || 0)],
        ['Duplicates Removed', String(data.duplicatesRemoved || 0)],
        ['Columns Detected', String(data.columns?.length || 0)]
      ],
      theme: 'striped',
      headStyles: { fillColor: [108, 92, 231] },
      styles: { fontSize: 10 }
    });

    // Column Statistics
    let yPos = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Column Statistics', 14, yPos);

    const colHeaders = ['Column', 'Type', 'Count', 'Mean', 'Median', 'Min', 'Max', 'Std'];
    const colData = data.columns.map((col) => {
      const stat = data.statistics[col] || {};
      const type = data.columnTypes[col] || 'unknown';
      return [
        col,
        type,
        String(stat.count ?? '—'),
        stat.mean !== undefined ? String(stat.mean) : '—',
        stat.median !== undefined ? String(stat.median) : '—',
        stat.min !== undefined ? String(stat.min) : '—',
        stat.max !== undefined ? String(stat.max) : '—',
        stat.std !== undefined ? String(stat.std) : '—'
      ];
    });

    doc.autoTable({
      startY: yPos + 5,
      head: [colHeaders],
      body: colData,
      theme: 'striped',
      headStyles: { fillColor: [0, 206, 201] },
      styles: { fontSize: 8 },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });

    // Categorical details
    const categoricalCols = data.columns.filter(
      (col) => data.statistics[col]?.type === 'categorical' && data.statistics[col]?.topValues
    );

    if (categoricalCols.length > 0) {
      let catY = doc.lastAutoTable.finalY + 15;

      // Check if we need a new page
      if (catY > 250) {
        doc.addPage();
        catY = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('Categorical Column Details', 14, catY);

      categoricalCols.forEach((col) => {
        const stat = data.statistics[col];
        catY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : catY + 5;

        if (catY > 260) {
          doc.addPage();
          catY = 20;
        }

        doc.setFontSize(12);
        doc.text(`${col} (${stat.unique} unique values)`, 14, catY);

        doc.autoTable({
          startY: catY + 3,
          head: [['Value', 'Count']],
          body: stat.topValues.map((v) => [v.value, String(v.count)]),
          theme: 'striped',
          headStyles: { fillColor: [253, 121, 168] },
          styles: { fontSize: 9 }
        });
      });
    }

    // Data Preview
    if (data.cleanedData && data.cleanedData.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('Cleaned Data Preview (First 20 Rows)', 14, 20);

      const previewData = data.cleanedData.slice(0, 20).map((row) =>
        data.columns.map((col) => String(row[col] ?? ''))
      );

      doc.autoTable({
        startY: 25,
        head: [data.columns],
        body: previewData,
        theme: 'striped',
        headStyles: { fillColor: [108, 92, 231] },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: data.columns.reduce((acc, _, i) => {
          acc[i] = { cellWidth: 'auto' };
          return acc;
        }, {})
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `DataLens Report • Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`DataLens_Report_${data.filename.replace('.csv', '')}.pdf`);
  };

  return (
    <div className="report-section">
      <h3>📄 Download Analysis Report</h3>
      <p>Get a comprehensive PDF report with cleaning summary, column statistics, and data preview.</p>
      <button className="report-btn" onClick={generatePDF} id="download-report">
        <span className="btn-icon">📥</span>
        Download PDF Report
      </button>
    </div>
  );
}

export default ReportDownload;
