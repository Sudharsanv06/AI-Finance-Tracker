const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\d024a500-b64a-4680-a5b5-648c698c05fe\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  const obj = JSON.parse(line);
  // Look for tool calls that wrote or replaced file contents
  if (obj.tool_calls) {
    for (const tc of obj.tool_calls) {
      if (tc.name === 'write_to_file' || tc.name === 'replace_file_content') {
        const args = tc.args || {};
        const target = args.TargetFile || args.targetFile || '';
        if (target.includes('ChatBot.jsx') || target.includes('AddTransactionScreen.jsx')) {
          console.log(`STEP ${obj.step_index}: Tool: ${tc.name}, File: ${target}`);
          console.log(`Content length: ${args.CodeContent ? args.CodeContent.length : (args.ReplacementContent ? args.ReplacementContent.length : 0)}`);
          if (args.CodeContent) {
            // Write it to a temporary file
            const base = target.includes('ChatBot.jsx') ? 'ChatBot_extracted.jsx' : 'AddTransactionScreen_extracted.jsx';
            fs.writeFileSync(base, args.CodeContent, 'utf8');
            console.log(`Wrote full content to ${base}`);
          }
        }
      }
    }
  }
});
