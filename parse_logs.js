const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\d024a500-b64a-4680-a5b5-648c698c05fe\\.system_generated\\logs\\transcript.jsonl";
const outputPath = "extracted_edits.txt";

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

let output = '';

rl.on('line', (line) => {
  const obj = JSON.parse(line);
  if (obj.type === 'CODE_ACTION') {
    const content = obj.content || '';
    const source = obj.source || '';
    const step = obj.step_index || 0;
    
    if (content.toLowerCase().includes('chatbot.jsx') || content.toLowerCase().includes('addtransactionscreen.jsx')) {
      output += `Step: ${step}, Source: ${source}\n`;
      output += content + '\n';
      output += '='.repeat(80) + '\n';
    }
  }
});

rl.on('close', () => {
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log('Done writing to ' + outputPath);
});
