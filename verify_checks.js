const fs = require('fs');

function countOccurrences(filePath, regex) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return 0;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

const checks = [
  {
    name: 'onStartShouldSetPanResponder in ChatBot.jsx',
    file: 'mobile/src/components/ChatBot.jsx',
    regex: /onStartShouldSetPanResponder/g,
    expected: '1'
  },
  {
    name: 'PAYMENT_METHODS in AddTransactionScreen.jsx',
    file: 'mobile/src/screens/AddTransactionScreen.jsx',
    regex: /PAYMENT_METHODS/g,
    expected: '>0'
  },
  {
    name: 'keyboardType="decimal-pad" in AddTransactionScreen.jsx',
    file: 'mobile/src/screens/AddTransactionScreen.jsx',
    regex: /keyboardType="decimal-pad"/g,
    expected: '1'
  },
  {
    name: 'maximumFractionDigits: 2 in helpers.js',
    file: 'mobile/src/utils/helpers.js',
    regex: /maximumFractionDigits:\s*2/g,
    expected: '1'
  },
  {
    name: 'getAccountBalance(k) in DashboardScreen.jsx',
    file: 'mobile/src/screens/DashboardScreen.jsx',
    regex: /getAccountBalance\(k\)/g,
    expected: '3'
  },
  {
    name: 'presentationStyle={Platform.OS in ChatBot.jsx',
    file: 'mobile/src/components/ChatBot.jsx',
    regex: /presentationStyle=\{Platform\.OS/g,
    expected: '1'
  },
  {
    name: 'restaurant-outline in BudgetPlannerScreen.jsx',
    file: 'mobile/src/screens/BudgetPlannerScreen.jsx',
    regex: /restaurant-outline/g,
    expected: '1'
  },
  {
    name: 'monthGrid or getOccurrencePreview in BillRemindersScreen.jsx',
    file: 'mobile/src/screens/BillRemindersScreen.jsx',
    regex: /monthGrid|getOccurrencePreview/g,
    expected: '>0'
  },
  {
    name: 'dueMonth in models/Bill.js',
    file: 'server/src/models/Bill.js',
    regex: /dueMonth/g,
    expected: '>0'
  },
  {
    name: 'getAnchorMonths in models/Bill.js',
    file: 'server/src/models/Bill.js',
    regex: /getAnchorMonths/g,
    expected: '>0'
  },
  {
    name: 'paymentMethod in controllers/billController.js',
    file: 'server/src/controllers/billController.js',
    regex: /paymentMethod/g,
    expected: '1'
  }
];

let allPassed = true;
console.log('--- RUNNING ALL VERIFICATION CHECKS ---');
checks.forEach(c => {
  const count = countOccurrences(c.file, c.regex);
  let passed = false;
  if (c.expected === '>0') {
    passed = count > 0;
  } else {
    passed = count === parseInt(c.expected);
  }
  if (!passed) allPassed = false;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${c.name} (Count: ${count}, Expected: ${c.expected})`);
});

console.log('---------------------------------------');
if (allPassed) {
  console.log('SUCCESS: All checks passed!');
  process.exit(0);
} else {
  console.error('ERROR: Some checks failed.');
  process.exit(1);
}
