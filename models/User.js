const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  program: {
    type: String,
    enum: ['IT', 'CS', 'IS'],
    default: 'IT',
  },
  targetYearLevel: {
    type: Number,
    default: 1,
  },
  targetSemester: {
    type: String,
    enum: ['1st', '2nd', 'Summer'],
    default: '2nd',
  },
  passedCourses: {
    type: [String],
    default: [],
  },
  failedCourses: {
    type: [String],
    default: ['CIS 1101'],
  },
  exceptionFlags: {
    courseOverride: { type: Boolean, default: false },
    overload: { type: Boolean, default: false },
    simultaneous: { type: Boolean, default: false },
    petitionNeeded: { type: Boolean, default: false }
  },
  gwa: {
    type: Number,
    default: 1.5,
  },
  unitsCompleted: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
