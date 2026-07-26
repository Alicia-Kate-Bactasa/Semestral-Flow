const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../seedData/it_prospectus.json'), 'utf8'));

const termTotals = {};

data.forEach(c => {
  const key = `Year ${c.yearLevel} • ${c.semester}`;
  if (!termTotals[key]) termTotals[key] = { count: 0, units: 0, courses: [] };
  termTotals[key].count++;
  termTotals[key].units += c.units;
  termTotals[key].courses.push(`${c.code} (${c.units}u)`);
});

console.log('--- IT Prospectus Catalog Terms ---');
Object.keys(termTotals).forEach(k => {
  console.log(`\n${k}: ${termTotals[k].count} courses, ${termTotals[k].units} total units`);
  console.log('  ' + termTotals[k].courses.join(', '));
});
