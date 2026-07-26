const { generateProspectusSchedule } = require('../services/schedulingEngine');

async function test() {
  const result = await generateProspectusSchedule({
    program: 'IT',
    passedCourses: [],
    failedCourses: ['CIS 1101'],
    targetYearLevel: 1,
    targetSemester: '2nd'
  });

  console.log('Regenerated terms count:', result.regeneratedTerms.length);
  result.regeneratedTerms.forEach(t => {
    console.log(`\n--- ${t.label} (${t.totalUnits}u) ---`);
    t.courses.forEach(c => {
      console.log(`  [${c.code}] ${c.title} (${c.units}u) - ${c.statusLabel}`);
    });
  });
}

test();
