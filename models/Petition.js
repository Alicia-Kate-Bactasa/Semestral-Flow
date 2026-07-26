const mongoose = require('mongoose');

const PetitionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  requestedBy: {
    type: String,
    required: true,
  },
  requestedByUsername: {
    type: String,
    required: true,
  },
  program: {
    type: String,
    enum: ['IT', 'CS', 'IS'],
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  currentSignatures: {
    type: Number,
    default: 1,
  },
  requiredSignatures: {
    type: Number,
    default: 15,
  },
  signatories: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['Pending Signatures', 'In Review', 'Approved', 'Rejected'],
    default: 'Pending Signatures',
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Petition || mongoose.model('Petition', PetitionSchema);
