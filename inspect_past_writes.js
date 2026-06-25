const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain';

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
              if (tc.name === 'write_to_file' || tc.name === 'replace_file_content') {
                const args = tc.args || {};
                const target = args.TargetFile || args.targetFile || '';
                if (target.includes('ChatBot') || target.includes('AddTransaction') || target.includes('helpers') || target.includes('BillReminders')) {
                  console.log(`Conv: ${d}, Step ${obj.step_index}, Tool=${tc.name}, Target=${target}`);
                }
              }
            });
          }
        } catch (e) {}
      });
    }
  });
} catch (err) {
  console.error('Error:', err.message);
}
