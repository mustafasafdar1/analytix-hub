const express = require('express');
const multer = require('multer');
const { cleanCSV } = require('../utils/cleanData');
const Upload = require('../models/Upload');

const router = express.Router();

// Configure multer for CSV uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.originalname.endsWith('.csv') ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// POST /api/upload — upload CSV, clean data, return results
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvString = req.file.buffer.toString('utf-8');
    const result = cleanCSV(csvString);

    // Save to MongoDB
    const record = await Upload.create({
      filename: req.file.originalname,
      originalRows: result.summary.originalRows,
      cleanedRows: result.summary.cleanedRows,
      nullsRemoved: result.summary.nullsRemoved,
      duplicatesRemoved: result.summary.duplicatesRemoved,
      emptyRowsRemoved: result.summary.emptyRowsRemoved,
      columns: result.columns,
      columnTypes: result.columnTypes,
      statistics: result.statistics,
      cleanedData: result.cleanedData
    });

    res.json({
      id: record._id,
      filename: req.file.originalname,
      ...result.summary,
      columns: result.columns,
      columnTypes: result.columnTypes,
      statistics: result.statistics,
      cleanedData: result.cleanedData
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Server error processing file' });
  }
});

// GET /api/upload/:id — fetch a past analysis
router.get('/:id', async (req, res) => {
  try {
    const record = await Upload.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Analysis not found' });

    res.json({
      id: record._id,
      filename: record.filename,
      originalRows: record.originalRows,
      cleanedRows: record.cleanedRows,
      nullsRemoved: record.nullsRemoved,
      duplicatesRemoved: record.duplicatesRemoved,
      emptyRowsRemoved: record.emptyRowsRemoved,
      columns: record.columns,
      columnTypes: Object.fromEntries(record.columnTypes),
      statistics: record.statistics,
      cleanedData: record.cleanedData,
      createdAt: record.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads — list recent uploads
router.get('/', async (req, res) => {
  try {
    const uploads = await Upload.find()
      .select('filename originalRows cleanedRows createdAt')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(uploads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
