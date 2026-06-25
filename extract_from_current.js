const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\0fa1f064-09a2-477b-8e4c-a8f57e99dd24\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    const text = JSON.stringify(obj);
    
    // Look for steps that contain the code edits
    if (obj.step_index === 134 || obj.step_index === 141 || obj.step_index === 225 || obj.step_index === 229) {
      console.log(`STEP ${obj.step_index}: source=${obj.source}, type=${obj.type}`);
      // Let's print out what tool_calls or diffs are in this step
      if (obj.tool_calls) {
        obj.tool_calls.forEach((tc, tIdx) => {
          console.log(`  Tool call ${tIdx}: ${tc.name}`);
        });
      }
      // If it's a code action from user or model
      if (obj.content) {
        console.log(`  Content length: ${obj.content.length}`);
        // Let's find files/diffs mentioned
        console.log(obj.content.substring(0, 500));
      }
    }
  } catch (e) {
  }
});
