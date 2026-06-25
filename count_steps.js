const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\d024a500-b64a-4680-a5b5-648c698c05fe\\.system_generated\\logs\\transcript.jsonl";

let count = 0;
const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    count = Math.max(count, obj.step_index);
  } catch (e) {}
});

rl.on('close', () => {
  console.log(`Max step index in d024a500-b64a-4680-a5b5-648c698c05fe: ${count}`);
});
