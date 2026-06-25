const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\d024a500-b64a-4680-a5b5-648c698c05fe\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

let count = 0;
rl.on('line', (line) => {
  const obj = JSON.parse(line);
  if (obj.type === 'PLANNER_RESPONSE' && count < 3) {
    console.log(`Step ${obj.step_index}: keys:`, Object.keys(obj));
    console.log(JSON.stringify(obj, null, 2).substring(0, 1500));
    console.log('='.repeat(80));
    count++;
  }
});
