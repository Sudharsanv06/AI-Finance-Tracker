const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = "C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\6b2987cc-c5b5-46ec-89d7-0a73830e78d0\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    // Look at step indices or text match
    const text = JSON.stringify(obj);
    
    // We are looking for blocks of code
    // Let's inspect step 798 or others
    if (obj.step_index === 798 || obj.step_index === 804 || obj.step_index === 833 || text.includes('ChatBot_v3.jsx') || text.includes('helpers_v2.js')) {
      console.log(`STEP ${obj.step_index}: source=${obj.source}, type=${obj.type}`);
      // Let's look for markdown blocks in content
      const content = obj.content || '';
      if (content) {
        // Find markdown code blocks
        const regex = /```(?:[a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)```/g;
        let match;
        let blockIdx = 0;
        while ((match = regex.exec(content)) !== null) {
          const code = match[1];
          console.log(`  Found code block ${blockIdx} of length ${code.length}`);
          // Let's inspect the first few lines of the code block to guess the file
          const firstLines = code.split('\n').slice(0, 10).join('\n');
          console.log(`  Preview:\n${firstLines}\n---`);
          
          // Save to a temp file based on content patterns
          if (code.includes('onStartShouldSetPanResponder') && code.includes('ChatBot')) {
            fs.writeFileSync('ChatBot_v3.jsx', code, 'utf8');
            console.log('  -> Saved to ChatBot_v3.jsx');
          } else if (code.includes('PAYMENT_METHODS') && code.includes('AddTransactionScreen')) {
            fs.writeFileSync('AddTransactionScreen_v2.jsx', code, 'utf8');
            console.log('  -> Saved to AddTransactionScreen_v2.jsx');
          } else if (code.includes('maximumFractionDigits') && code.includes('formatCurrency')) {
            fs.writeFileSync('helpers_v2.js', code, 'utf8');
            console.log('  -> Saved to helpers_v2.js');
          } else if (code.includes('BillRemindersScreen') && code.includes('PAYMENT_METHODS')) {
            fs.writeFileSync('BillRemindersScreen_v2.jsx', code, 'utf8');
            console.log('  -> Saved to BillRemindersScreen_v2.jsx');
          }
          blockIdx++;
        }
      }
    }
  } catch (e) {
    // Ignore invalid JSON lines
  }
});
