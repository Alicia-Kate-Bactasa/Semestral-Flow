const express = require('express');
const router = express.Router();
const Petition = require('../models/Petition');

/**
 * GET /api/petitions
 * Fetches all petitions from MongoDB (with initial seed population if empty)
 */
router.get('/', async (req, res) => {
  try {
    let petitions = [];
    try {
      petitions = await Petition.find().sort({ createdAt: -1 }).lean();
    } catch (dbErr) {
      console.warn('⚡ Using memory fallback for petitions:', dbErr.message);
    }

    if (!petitions || petitions.length === 0) {
      // Seed default petitions in database if empty
      const defaultPetitions = [
        {
          code: 'IT 3103A',
          title: 'Systems Integration and Architecture',
          requestedBy: 'Alicia Bactasa',
          requestedByUsername: '21102941',
          program: 'IT',
          reason: 'Off-cycle subject required for Year 3 Capstone prerequisite chain.',
          currentSignatures: 12,
          requiredSignatures: 15,
          status: 'In Review'
        },
        {
          code: 'CIS 2201',
          title: 'Systems Analysis and Design',
          requestedBy: 'Mark Rivera',
          requestedByUsername: '21104882',
          program: 'IT',
          reason: 'Special summer section petition for dissolved class block.',
          currentSignatures: 15,
          requiredSignatures: 15,
          status: 'Approved'
        }
      ];

      try {
        petitions = await Petition.insertMany(defaultPetitions);
      } catch (insertErr) {
        petitions = defaultPetitions;
      }
    }

    return res.json({ success: true, count: petitions.length, petitions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch petitions', error: error.message });
  }
});

/**
 * POST /api/petitions
 * Creates a new petition in MongoDB
 */
router.post('/', async (req, res) => {
  try {
    const { code, title, requestedBy, requestedByUsername, program, reason } = req.body;

    if (!code || !requestedBy) {
      return res.status(400).json({ success: false, message: 'Course code and requestedBy are required' });
    }

    const petition = new Petition({
      code: code.toUpperCase(),
      title: title || 'Off-Cycle Petition Subject',
      requestedBy: requestedBy || 'Student User',
      requestedByUsername: requestedByUsername || '21102941',
      program: program || 'IT',
      reason: reason || 'Off-cycle prerequisite unlock petition.',
      currentSignatures: 1,
      requiredSignatures: 15,
      signatories: [requestedByUsername || '21102941'],
      status: 'Pending Signatures'
    });

    await petition.save();

    return res.json({ success: true, message: 'Petition created successfully', petition });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create petition', error: error.message });
  }
});

/**
 * POST /api/petitions/:id/sign
 * Signs an existing petition in MongoDB
 */
router.post('/:id/sign', async (req, res) => {
  try {
    const { username } = req.body;
    const petitionId = req.params.id;

    const petition = await Petition.findById(petitionId);
    if (!petition) {
      return res.status(404).json({ success: false, message: 'Petition not found' });
    }

    if (petition.currentSignatures < petition.requiredSignatures) {
      petition.currentSignatures += 1;
      if (username && !petition.signatories.includes(username)) {
        petition.signatories.push(username);
      }
      if (petition.currentSignatures >= petition.requiredSignatures) {
        petition.status = 'Approved';
      }
      await petition.save();
    }

    return res.json({ success: true, message: 'Petition signed successfully', petition });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to sign petition', error: error.message });
  }
});

module.exports = router;
