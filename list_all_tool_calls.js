const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\d024a500-b64a-4680-a5b5-648c698c05fe\\.system_generated\\logs\\transcript.jsonl";

if (!fs.existsSync(logPath)) {
  console.log(`Log path not found: ${logPath}`);
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        const args = tc.args || {};
        const target = args.TargetFile || args.targetFile || args.AbsolutePath || '';
        console.log(`Step ${obj.step_index}: Tool=${tc.name}, Target=${target}, CodeLength=${args.CodeContent ? args.CodeContent.length : 0}`);
      });
    }
  } catch (e) {}
});
