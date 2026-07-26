const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
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
  units: {
    type: Number,
    required: true,
    default: 3,
  },
  program: {
    type: String,
    enum: ['IT', 'CS', 'IS'],
    required: true,
  },
  yearLevel: {
    type: Number,
    required: true,
  },
  semester: {
    type: String,
    enum: ['1st', '2nd', 'Summer'],
    required: true,
  },
  prerequisites: {
    type: [String],
    default: [],
  },
  ifPassCanTake: {
    type: [String],
    default: [],
  },
  ifFailCannotTake: {
    type: [String],
    default: [],
  },
  standingRequirement: {
    type: String,
    default: 'None', // e.g. "2nd Year Standing", "3rd Year Standing"
  }
}, {
  timestamps: true
});

// Compound Index to query quickly by program, yearLevel, semester, and code
CourseSchema.index({ program: 1, yearLevel: 1, semester: 1 });
CourseSchema.index({ program: 1, code: 1 }, { unique: true });

module.exports = mongoose.models.Course || mongoose.model('Course', CourseSchema);
