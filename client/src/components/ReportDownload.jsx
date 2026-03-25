import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function ReportDownload({ data }) {
  const generateStory = (data) => {
    let story = [];
    const efficiency = ((data.cleanedRows / (data.originalRows || 1)) * 100).toFixed(1);
    
    story.push(`The dataset "${data.filename}" initially contained ${data.originalRows} records. After a rigorous automated cleaning process, ${data.originalRows - data.cleanedRows} invalid records were removed.`);
    
    if (data.nullsRemoved > 0 || data.duplicatesRemoved > 0) {
      story.push(`This included the stripping of ${data.nullsRemoved} missing/null elements and the removal of ${data.duplicatesRemoved} duplicate entries. The resulting dataset retains ${data.cleanedRows} high-quality rows across ${data.columns.length} columns (a ${efficiency}% retention rate).`);
    } else {
      story.push(`The data was already in excellent health, retaining 100% of its initial volume across ${data.columns.length} distinct columns.`);
    }

    const numCols = (data.columns || []).filter(c => data.columnTypes[c] === 'numeric' && data.statistics[c]?.count > 0);
    if (numCols.length > 0) {
      story.push(`\nNumerical Insights:`);
      numCols.slice(0, 4).forEach(col => {
        const stat = data.statistics[col];
        story.push(`• For "${col}", values average around ${stat.mean}. The distribution spans from a minimum of ${stat.min} to a peak of ${stat.max}, with a median midpoint of ${stat.median}.`);
      });
    }

    const catCols = (data.columns || []).filter(c => data.columnTypes[c] === 'categorical' && data.statistics[c]?.topValues?.length > 0);
    if (catCols.length > 0) {
      story.push(`\nCategorical Insights:`);
      catCols.slice(0, 4).forEach(col => {
        const stat = data.statistics[col];
        const top = stat.topValues[0];
        story.push(`• In the "${col}" category, there are ${stat.unique} unique classifications. The most dominant grouping is "${top.value}", appearing ${top.count} times.`);
      });
    }
    
    story.push(`\nConclusion:`);
    story.push(`Overall, the data profiling indicates a coherent structure. The dataset is now completely sanitized and primed for advanced predictive modeling, business intelligence visualizations, or immediate downstream operational use.`);
    
    return story;
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(22);
      doc.setTextColor(108, 92, 231);
      doc.text('DataLens Analysis Report', pageWidth / 2, 25, { align: 'center' });

      // Filename & date
      doc.setFontSize(11);
      doc.setTextColor(100);
      const safeFilename = data?.filename ? data.filename : 'Data_Export.csv';
      doc.text(`File: ${safeFilename}`, 14, 40);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 47);

      // Cleaning Summary
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('Data Cleaning Summary', 14, 62);

      autoTable(doc, {
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

      // Executive Summary (Data Story)
      doc.addPage();
      doc.setFontSize(22);
      doc.setTextColor(108, 92, 231);
      doc.text('Executive Summary', 14, 25);
      
      doc.setFontSize(11);
      doc.setTextColor(60);
      const storyLines = generateStory(data);
      let currentY = 40;
      
      storyLines.forEach(line => {
        // Handle bolding for headers
        if (line.startsWith('\n')) {
          currentY += 8;
          doc.setFont(undefined, 'bold');
          doc.setTextColor(40);
          line = line.replace('\n', '');
        } else if (line.startsWith('•')) {
          doc.setFont(undefined, 'normal');
          doc.setTextColor(80);
        } else {
          doc.setFont(undefined, 'normal');
          doc.setTextColor(60);
        }

        const splitText = doc.splitTextToSize(line, pageWidth - 28);
        doc.text(splitText, 14, currentY);
        currentY += (splitText.length * 6) + 4;
      });

      // Column Statistics
      doc.addPage();
      let yPos = 20;
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text('Column Statistics', 14, yPos);

      const colHeaders = ['Column', 'Type', 'Count', 'Mean', 'Median', 'Min', 'Max', 'Std'];
      const colData = (data.columns || []).map((col) => {
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

      autoTable(doc, {
        startY: yPos + 5,
        head: [colHeaders],
        body: colData,
        theme: 'striped',
        headStyles: { fillColor: [0, 206, 201] },
        styles: { fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold' } }
      });

      // Categorical details
      const categoricalCols = (data.columns || []).filter(
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

          autoTable(doc, {
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

        autoTable(doc, {
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

      doc.save(`DataLens_Report_${safeFilename.replace('.csv', '')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('There was an error generating your PDF report. Check the console for details.');
    }
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
