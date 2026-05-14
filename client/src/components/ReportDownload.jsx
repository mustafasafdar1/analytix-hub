import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);

function ReportDownload({ data }) {
  const handleDownloadCSV = () => {
    const cols = data.columns || [];
    const rows = data.cleanedData || [];
    let csv = cols.join(',') + '\n';
    rows.forEach(row => {
      csv += cols.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (data.filename || 'data').replace('.csv', '') + '_cleaned.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addWrappedText = (doc, text, x, y, maxWidth, lineHeight = 6) => {
    const paragraphs = (text || '').split('\n\n');
    let currentY = y;
    paragraphs.forEach(para => {
      const trimmed = para.trim();
      if (!trimmed) return;
      const lines = doc.splitTextToSize(trimmed, maxWidth);
      lines.forEach(line => {
        if (currentY > doc.internal.pageSize.getHeight() - 25) {
          doc.addPage();
          currentY = 25;
        }
        doc.text(line, x, currentY);
        currentY += lineHeight;
      });
      currentY += 3;
    });
    return currentY;
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const safeFilename = data?.filename || 'Data_Export.csv';
      const analysis = data.analysis || {};
      const margin = 14;
      const textWidth = pw - margin * 2;

      // ===== PAGE 1: TITLE =====
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pw, 55, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont(undefined, 'bold');
      doc.text('AnalytixHub', pw / 2, 25, { align: 'center' });
      doc.setFontSize(13);
      doc.setFont(undefined, 'normal');
      doc.text('Comprehensive Data Analysis Report', pw / 2, 36, { align: 'center' });
      doc.setFontSize(10);
      doc.text(safeFilename + '  |  ' + new Date().toLocaleDateString(), pw / 2, 47, { align: 'center' });

      doc.setTextColor(80);
      doc.setFontSize(10);
      doc.text('Quality Score: ' + (data.dataQualityScore || 0) + '/100', margin, 70);
      doc.text('Records: ' + (data.originalRows || 0) + ' original -> ' + (data.cleanedRows || 0) + ' cleaned', margin, 78);
      doc.text('Columns: ' + (data.columns?.length || 0) + '  |  Generated: ' + new Date().toLocaleString(), margin, 86);

      // Cleaning summary
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.setFont(undefined, 'bold');
      doc.text('Data Cleaning Summary', margin, 102);

      const eff = data.originalRows > 0 ? ((data.cleanedRows / data.originalRows) * 100).toFixed(1) : '100';
      doc.autoTable({
        startY: 108,
        head: [['Metric', 'Value']],
        body: [
          ['Original Rows', String(data.originalRows || 0)],
          ['Cleaned Rows', String(data.cleanedRows || 0)],
          ['Rows Removed', String((data.originalRows || 0) - (data.cleanedRows || 0))],
          ['Null/NaN Removed', String(data.nullsRemoved || 0)],
          ['Duplicates Removed', String(data.duplicatesRemoved || 0)],
          ['Columns Analyzed', String(data.columns?.length || 0)],
          ['Retention Rate', eff + '%'],
          ['Data Quality Score', (data.dataQualityScore || 0) + '/100']
        ],
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      });

      // ===== PAGE 2: DESCRIPTIVE =====
      doc.addPage();
      doc.setFillColor(6, 214, 160);
      doc.rect(0, 0, pw, 8, 'F');
      doc.setFontSize(20);
      doc.setTextColor(6, 214, 160);
      doc.setFont(undefined, 'bold');
      doc.text('1. Descriptive Analysis', margin, 25);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.setFont(undefined, 'italic');
      doc.text('What happened in the data - key findings from statistical profiling', margin, 33);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(50);
      doc.setFontSize(10);
      addWrappedText(doc, analysis.descriptive || 'No descriptive analysis available.', margin, 44, textWidth);

      // ===== PAGE 3: PREDICTIVE =====
      doc.addPage();
      doc.setFillColor(56, 189, 248);
      doc.rect(0, 0, pw, 8, 'F');
      doc.setFontSize(20);
      doc.setTextColor(56, 189, 248);
      doc.setFont(undefined, 'bold');
      doc.text('2. Predictive Analysis', margin, 25);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.setFont(undefined, 'italic');
      doc.text('What is likely to happen - forecasts and trends based on patterns', margin, 33);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(50);
      doc.setFontSize(10);
      addWrappedText(doc, analysis.predictive || 'No predictive analysis available.', margin, 44, textWidth);

      // ===== PAGE 4: PRESCRIPTIVE =====
      doc.addPage();
      doc.setFillColor(244, 114, 182);
      doc.rect(0, 0, pw, 8, 'F');
      doc.setFontSize(20);
      doc.setTextColor(244, 114, 182);
      doc.setFont(undefined, 'bold');
      doc.text('3. Prescriptive Analysis', margin, 25);
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.setFont(undefined, 'italic');
      doc.text('What actions to take - recommendations and next steps', margin, 33);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(50);
      doc.setFontSize(10);
      addWrappedText(doc, analysis.prescriptive || 'No prescriptive analysis available.', margin, 44, textWidth);

      // ===== PAGE 5: COLUMN STATS =====
      doc.addPage();
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pw, 8, 'F');
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.setFont(undefined, 'bold');
      doc.text('Column Statistics', margin, 25);

      const colData = (data.columns || []).map(col => {
        const s = data.statistics?.[col] || {};
        const t = data.columnTypes?.[col] || '?';
        return [col, t, String(s.count ?? '-'), s.mean !== undefined ? String(s.mean) : '-', s.median !== undefined ? String(s.median) : '-', s.min !== undefined ? String(s.min) : '-', s.max !== undefined ? String(s.max) : '-', s.std !== undefined ? String(s.std) : '-', s.q1 !== undefined ? String(s.q1) : '-', s.q3 !== undefined ? String(s.q3) : '-'];
      });

      doc.autoTable({
        startY: 32,
        head: [['Column', 'Type', 'Count', 'Mean', 'Median', 'Min', 'Max', 'Std', 'Q1', 'Q3']],
        body: colData,
        theme: 'striped',
        headStyles: { fillColor: [6, 214, 160], fontStyle: 'bold' },
        styles: { fontSize: 7.5 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: margin, right: margin }
      });

      // Outlier table
      const outlierEntries = Object.entries(data.outlierSummary || {});
      if (outlierEntries.length > 0) {
        let oy = doc.lastAutoTable.finalY + 14;
        if (oy > 240) { doc.addPage(); oy = 25; }
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.setFont(undefined, 'bold');
        doc.text('Outlier Analysis', margin, oy);
        doc.autoTable({
          startY: oy + 6,
          head: [['Column', 'Outliers', '% of Data', 'Lower Bound', 'Upper Bound']],
          body: outlierEntries.map(([col, info]) => [col, String(info.count), info.percentage + '%', String(info.bounds?.lower ?? '-'), String(info.bounds?.upper ?? '-')]),
          theme: 'striped',
          headStyles: { fillColor: [244, 114, 182] },
          styles: { fontSize: 9 },
          margin: { left: margin, right: margin }
        });
      }

      // Correlation Matrix
      const corrMatrix = data.correlationMatrix || {};
      const numCols = (data.columns || []).filter(c => data.columnTypes?.[c] === 'numeric');
      if (numCols.length >= 2 && Object.keys(corrMatrix).length > 0) {
        doc.addPage();
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pw, 8, 'F');
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.setFont(undefined, 'bold');
        doc.text('Correlation Matrix', margin, 25);
        const corrBody = numCols.map(r => [r, ...numCols.map(c => String(corrMatrix[r]?.[c] ?? '-'))]);
        doc.autoTable({
          startY: 32,
          head: [['', ...numCols]],
          body: corrBody,
          theme: 'grid',
          headStyles: { fillColor: [99, 102, 241], fontSize: 7 },
          styles: { fontSize: 7, cellPadding: 2 },
          columnStyles: { 0: { fontStyle: 'bold' } },
          margin: { left: margin, right: margin }
        });
      }

      // Categorical Details
      const catCols = (data.columns || []).filter(c => data.statistics?.[c]?.type === 'categorical' && data.statistics?.[c]?.topValues);
      if (catCols.length > 0) {
        doc.addPage();
        doc.setFillColor(251, 191, 36);
        doc.rect(0, 0, pw, 8, 'F');
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.setFont(undefined, 'bold');
        doc.text('Categorical Breakdown', margin, 25);

        let catY = 32;
        catCols.forEach(col => {
          const stat = data.statistics[col];
          if (catY > 240) { doc.addPage(); catY = 25; }
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(60);
          doc.text(col + ' (' + stat.unique + ' unique)', margin, catY);
          doc.autoTable({
            startY: catY + 4,
            head: [['Value', 'Count']],
            body: stat.topValues.map(v => [v.value, String(v.count)]),
            theme: 'striped',
            headStyles: { fillColor: [251, 191, 36], textColor: [40, 40, 40] },
            styles: { fontSize: 9 },
            margin: { left: margin, right: margin }
          });
          catY = doc.lastAutoTable.finalY + 12;
        });
      }

      // Data Preview
      if (data.cleanedData?.length > 0) {
        doc.addPage();
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pw, 8, 'F');
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.setFont(undefined, 'bold');
        doc.text('Cleaned Data Preview (First 25 Rows)', margin, 25);
        const preview = data.cleanedData.slice(0, 25).map(row => (data.columns || []).map(c => String(row[c] ?? '')));
        doc.autoTable({
          startY: 32,
          head: [data.columns],
          body: preview,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
          styles: { fontSize: 6.5, cellPadding: 2 },
          margin: { left: margin, right: margin }
        });
      }

      // Footers
      const pc = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pc; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text('AnalytixHub Report  |  ' + safeFilename + '  |  Page ' + i + '/' + pc, pw / 2, ph - 8, { align: 'center' });
      }

      // Save the PDF
      doc.save('AnalytixHub_Report_' + safeFilename.replace('.csv', '') + '.pdf');

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF: ' + err.message);
    }
  };

  return (
    <div className="report-section">
      <h3>Export Your Analysis</h3>
      <p>Download a comprehensive PDF report with descriptive, predictive and prescriptive analysis, or the cleaned CSV data.</p>
      <div className="report-actions">
        <button className="report-btn" onClick={generatePDF} id="download-report">
          <span className="btn-icon">📥</span>
          Download PDF Report
        </button>
        <button className="report-btn secondary" onClick={handleDownloadCSV} id="download-csv">
          <span className="btn-icon">📊</span>
          Download Cleaned CSV
        </button>
      </div>
    </div>
  );
}

export default ReportDownload;
