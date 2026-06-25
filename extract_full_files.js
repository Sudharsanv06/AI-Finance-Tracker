const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain';
const targetBasenames = ['ChatBot.jsx', 'AddTransactionScreen.jsx', 'helpers.js', 'BillRemindersScreen.jsx'];

try {
  const dirs = fs.readdirSync(brainDir);
  dirs.forEach(d => {
    const transcriptPath = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(transcriptPath)) {
      const content = fs.readFileSync(transcriptPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (!line.trim()) return;
        try {
          const obj = JSON.parse(line);
          if (obj.tool_calls) {
            obj.tool_calls.forEach(tc => {
              const name = tc.name;
              const args = tc.args || {};
              const target = args.TargetFile || args.targetFile || args.AbsolutePath || '';
              
              targetBasenames.forEach(base => {
                if (target.endsWith(base)) {
                  console.log(`Found tool call ${name} targeting ${base} in conversation ${d} (step ${obj.step_index})`);
                  
                  // Let's see if there is code content
                  const code = args.CodeContent || args.ReplacementContent || '';
                  if (code && code.length > 500) {
                    const outPath = `${base}_extracted_${d}_step${obj.step_index}.js`;
                    fs.writeFileSync(outPath, code, 'utf8');
                    console.log(`  -> Extracted ${code.length} characters to ${outPath}`);
                  }
                }
              });
            });
          }
        } catch (e) {}
      });
    }
  });
} catch (err) {
  console.error('Error scanning transcripts:', err.message);
}
