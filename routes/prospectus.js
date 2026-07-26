const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { generateProspectusSchedule } = require('../services/schedulingEngine');
const { loadPrivateSeedData, seedDatabase } = require('../seedProspectus');

/**
 * POST /api/generate-prospectus
 * Calculates irregular student DAG prospectus schedule with dynamic historical state rebuilding
 */
router.post('/generate-prospectus', async (req, res) => {
  try {
    const {
      program = 'IT',
      passedCourses = [],
      failedCourses = [],
      completedSemestersCount = 1,
      historicalTermRecords = null,
      customTermPlans = {},
      exceptionFlags = {}
    } = req.body;

    const result = await generateProspectusSchedule({
      program,
      passedCourses,
      failedCourses,
      completedSemestersCount: parseInt(completedSemestersCount, 10) || 1,
      historicalTermRecords,
      customTermPlans,
      exceptionFlags
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error generating prospectus schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate prospectus schedule',
      error: error.message
    });
  }
});

/**
 * GET /api/courses/:program
 * Fetches all curriculum courses for a given program (IT, CS, or IS)
 */
router.get('/courses/:program', async (req, res) => {
  try {
    const program = req.params.program.toUpperCase();
    let courses = [];

    try {
      courses = await Course.find({ program }).sort({ yearLevel: 1, semester: 1, code: 1 }).lean();
    } catch (err) {
      console.warn('⚡ Using memory seed fallback for course list:', err.message);
    }

    if (!courses || courses.length === 0) {
      const fallbackData = loadPrivateSeedData();
      courses = fallbackData.filter(c => c.program === program);
    }

    return res.json({
      success: true,
      count: courses.length,
      program,
      courses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

/**
 * POST /api/seed
 * Triggers database seeding
 */
router.post('/seed', async (req, res) => {
  try {
    const result = await seedDatabase();
    return res.json({ success: true, message: 'Database seeded successfully', result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Seeding failed', error: err.message });
  }
});

module.exports = router;
