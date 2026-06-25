const fs = require('fs');
const content = fs.readFileSync('all_tool_calls.txt', 'utf8');
const lines = content.split('\n');
const targets = ['ChatBot', 'AddTransactionScreen', 'helpers.js', 'BillRemindersScreen'];

lines.forEach(line => {
  targets.forEach(t => {
    if (line.includes(t)) {
      console.log(line);
    }
  });
});
