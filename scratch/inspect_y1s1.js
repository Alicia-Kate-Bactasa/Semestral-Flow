const { loadPrivateSeedData } = require('../seedProspectus');

const data = loadPrivateSeedData();
const y1s1 = data.filter(c => c.program === 'IT' && c.yearLevel === 1 && (c.semester === '1st' || c.semester === '1'));

console.log('Year 1 Sem 1 IT courses count:', y1s1.length);
let total = 0;
y1s1.forEach(c => {
  console.log(`- [${c.code}] ${c.title}: ${c.units} units`);
  total += c.units;
});
console.log('Total units:', total);
