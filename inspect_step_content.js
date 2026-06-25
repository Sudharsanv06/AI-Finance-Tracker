const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\6b2987cc-c5b5-46ec-89d7-0a73830e78d0\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 798) {
      console.log('--- STEP 798 content preview ---');
      console.log(obj.content ? obj.content.substring(0, 1000) : 'No content');
      console.log('--- END PREVIEW ---');
    }
  } catch (e) {}
});
