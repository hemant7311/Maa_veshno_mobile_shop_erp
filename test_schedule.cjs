const { generateEmiSchedule } = require('./backend/utils/financeUtils');

const startDate = new Date('2024-01-31'); // Leap year
console.log('Start Date:', startDate);

const schedule = generateEmiSchedule(6, 5000, startDate, 1);
console.log(schedule);
