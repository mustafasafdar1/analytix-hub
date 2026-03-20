const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalRows: { type: Number, required: true },
  cleanedRows: { type: Number, required: true },
  nullsRemoved: { type: Number, default: 0 },
  duplicatesRemoved: { type: Number, default: 0 },
  emptyRowsRemoved: { type: Number, default: 0 },
  columns: [String],
  columnTypes: { type: Map, of: String },
  statistics: { type: mongoose.Schema.Types.Mixed },
  cleanedData: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Upload', uploadSchema);
