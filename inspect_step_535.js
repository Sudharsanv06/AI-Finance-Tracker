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
    if (obj.step_index === 535) {
      console.log('--- STEP 535 TOOL CALLS ---');
      console.log(JSON.stringify(obj.tool_calls, null, 2));
      // Save it directly!
      const tc = obj.tool_calls[0];
      const code = tc.args.CodeContent || tc.args.codeContent || '';
      if (code) {
        fs.writeFileSync('ChatBot_v3.jsx', code, 'utf8');
        console.log('Saved ChatBot_v3.jsx!');
      }
    }
  } catch (e) {}
});
