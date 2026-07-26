const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * POST /api/auth/register
 * Registers a new student in MongoDB
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, program } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ success: false, message: 'Username, password, and name are required' });
    }

    let existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Student ID / Username already registered' });
    }

    const user = new User({
      username,
      password, // In production, hash with bcrypt
      name,
      program: program || 'IT',
      failedCourses: ['CIS 1101']
    });

    await user.save();

    return res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        program: user.program,
        targetYearLevel: user.targetYearLevel,
        targetSemester: user.targetSemester,
        passedCourses: user.passedCourses,
        failedCourses: user.failedCourses,
        exceptionFlags: user.exceptionFlags,
        gwa: user.gwa,
        unitsCompleted: user.unitsCompleted
      }
    });
  } catch (err) {
    console.error('Error in register route:', err);
    return res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Authenticates student against MongoDB (with seed fallback user support)
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password, program } = req.body;

    let user = null;
    try {
      user = await User.findOne({ username });
    } catch (err) {
      console.warn('⚡ MongoDB query fallback:', err.message);
    }

    if (!user) {
      // Auto-create or fetch seed student in database for instant demonstration
      user = new User({
        username: username || '21102941',
        password: password || 'demo1234',
        name: username === '21104882' ? 'Mark Rivera' : (username === '21109920' ? 'Sarah Tan' : 'Alicia Bactasa'),
        program: program || 'IT',
        failedCourses: ['CIS 1101'],
        passedCourses: ['CIS 1102N', 'CIS 1103', 'CIS 1104', 'EDM 1', 'GE-MMW', 'GE-PC', 'GE-UTS', 'NSTP 1', 'TPE 1101']
      });

      try {
        await user.save();
      } catch (saveErr) {
        // If unique constraint error, fetch again
        user = await User.findOne({ username });
      }
    }

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        program: user.program,
        targetYearLevel: user.targetYearLevel || 1,
        targetSemester: user.targetSemester || '2nd',
        passedCourses: user.passedCourses || [],
        failedCourses: user.failedCourses || ['CIS 1101'],
        exceptionFlags: user.exceptionFlags || {
          courseOverride: false,
          overload: false,
          simultaneous: false,
          petitionNeeded: false
        },
        gwa: user.gwa || 1.45,
        unitsCompleted: user.unitsCompleted || 42
      }
    });
  } catch (err) {
    console.error('Error in login route:', err);
    return res.status(500).json({ success: false, message: 'Login error', error: err.message });
  }
});

/**
 * PUT /api/auth/student-state
 * Persists student failed courses, target term, and exception flags in MongoDB
 */
router.put('/student-state', async (req, res) => {
  try {
    const { username, program, targetYearLevel, targetSemester, passedCourses, failedCourses, exceptionFlags } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { username },
      {
        $set: {
          program,
          targetYearLevel,
          targetSemester,
          passedCourses,
          failedCourses,
          exceptionFlags
        }
      },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: 'Student state saved to database',
      user: updatedUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update student state', error: err.message });
  }
});

module.exports = router;
