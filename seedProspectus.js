require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Course = require('./models/Course');

const dbUser = process.env.DB_USER || '';
const dbPass = process.env.DB_PASS || '';
const dbName = process.env.DB_NAME || 'semestral_flow';

const mongoUri = process.env.MONGODB_URI || (
  dbUser && dbPass 
    ? `mongodb://${dbUser}:${dbPass}@localhost:27017/${dbName}`
    : `mongodb://localhost:27017/${dbName}`
);

// Load private JSON seed datasets from single `seedData` directory
function loadPrivateSeedData() {
  const seedDir = path.join(__dirname, 'seedData');
  const files = ['it_prospectus.json', 'cs_prospectus.json', 'is_prospectus.json'];
  let allCourses = [];

  files.forEach(file => {
    const filePath = path.join(seedDir, file);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      allCourses = allCourses.concat(data);
    } else {
      console.warn(`[Seed Warning] File not found: ${filePath}`);
    }
  });

  return allCourses;
}

async function seedDatabase() {
  try {
    console.log(`🔌 Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    const seedData = loadPrivateSeedData();
    console.log(`📦 Found ${seedData.length} course nodes across IT, CS, and IS prospectuses.`);

    await Course.deleteMany({});
    console.log('🧹 Cleared existing course dictionary.');

    const inserted = await Course.insertMany(seedData);
    console.log(`🎉 Successfully seeded ${inserted.length} course nodes into MongoDB!`);

    await mongoose.disconnect();
    console.log('👋 Disconnected cleanly from database.');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, loadPrivateSeedData };
