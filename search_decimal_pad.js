const fs = require('fs');

const logPath = "C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\f5b353f1-a4a8-4ec3-91e1-982c57ada470\\.system_generated\\logs\\transcript.jsonl";
const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('decimal-pad')) {
    try {
      const obj = JSON.parse(line);
      console.log(`Step ${obj.step_index}: source: ${obj.source}`);
      console.log(obj.content ? obj.content.substring(0, 1500) : 'No content');
      if (obj.tool_calls) {
        console.log("Tool calls:", JSON.stringify(obj.tool_calls, null, 2).substring(0, 1500));
      }
      console.log('='.repeat(80));
    } catch(e) {
      console.log(`Line ${idx}: Non-JSON or parse error line:`, line.substring(0, 200));
    }
  }
});
