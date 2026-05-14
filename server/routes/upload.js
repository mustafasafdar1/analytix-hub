const express = require('express');
const multer = require('multer');
const { cleanCSV } = require('../utils/cleanData');
const Upload = require('../models/Upload');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.originalname.endsWith('.csv') ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/octet-stream'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// POST /api/upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.size === 0) return res.status(400).json({ error: 'File is empty' });

    const csvString = req.file.buffer.toString('utf-8');
    const result = cleanCSV(csvString);

    if (!result.columns || result.columns.length === 0) {
      return res.status(400).json({ error: 'No valid columns found in CSV' });
    }

    let record = null;
    try {
      record = await Upload.create({
        filename: req.file.originalname,
        originalRows: result.summary.originalRows,
        cleanedRows: result.summary.cleanedRows,
        nullsRemoved: result.summary.nullsRemoved,
        duplicatesRemoved: result.summary.duplicatesRemoved,
        emptyRowsRemoved: result.summary.emptyRowsRemoved,
        conclusion: result.summary.conclusion,
        dataQualityScore: result.dataQualityScore,
        columns: result.columns,
        columnTypes: result.columnTypes,
        statistics: result.statistics,
        correlationMatrix: result.correlationMatrix,
        outlierSummary: result.outlierSummary,
        cleanedData: result.cleanedData
      });
    } catch (dbErr) {
      console.warn('MongoDB save failed:', dbErr.message);
    }

    res.json({
      id: record?._id || null,
      filename: req.file.originalname,
      ...result.summary,
      columns: result.columns,
      columnTypes: result.columnTypes,
      statistics: result.statistics,
      correlationMatrix: result.correlationMatrix || {},
      outlierSummary: result.outlierSummary || {},
      dataQualityScore: result.dataQualityScore,
      analysis: result.analysis || {},
      cleanedData: result.cleanedData
    });
  } catch (err) {
    console.error('Upload error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 200MB.' });
    }
    res.status(500).json({ error: err.message || 'Server error processing file' });
  }
});

// GET /api/upload/download/:id — download cleaned CSV
router.get('/download/:id', async (req, res) => {
  try {
    const record = await Upload.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });

    const columns = record.columns;
    const rows = record.cleanedData || [];
    
    let csv = columns.join(',') + '\n';
    rows.forEach(row => {
      csv += columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? '"' + str.replace(/"/g, '""') + '"'
          : str;
      }).join(',') + '\n';
    });

    const cleanName = record.filename.replace('.csv', '') + '_cleaned.csv';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanName}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/:id
router.get('/:id', async (req, res) => {
  try {
    const record = await Upload.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });

    res.json({
      id: record._id,
      filename: record.filename,
      originalRows: record.originalRows,
      cleanedRows: record.cleanedRows,
      nullsRemoved: record.nullsRemoved,
      duplicatesRemoved: record.duplicatesRemoved,
      emptyRowsRemoved: record.emptyRowsRemoved,
      conclusion: record.conclusion,
      dataQualityScore: record.dataQualityScore || 0,
      columns: record.columns,
      columnTypes: Object.fromEntries(record.columnTypes),
      statistics: record.statistics,
      correlationMatrix: record.correlationMatrix || {},
      outlierSummary: record.outlierSummary || {},
      cleanedData: record.cleanedData || [],
      createdAt: record.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload — list
router.get('/', async (req, res) => {
  try {
    const uploads = await Upload.find()
      .select('filename originalRows cleanedRows dataQualityScore createdAt')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(uploads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/upload/:id
router.delete('/:id', async (req, res) => {
  try {
    const record = await Upload.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
