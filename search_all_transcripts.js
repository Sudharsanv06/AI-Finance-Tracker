const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain';
const targets = ["Could not set profile photo", "height: Math.min"];

try {
  const dirs = fs.readdirSync(brainDir);
  dirs.forEach(d => {
    const transcriptPath = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(transcriptPath)) {
      const content = fs.readFileSync(transcriptPath, 'utf8');
      targets.forEach(target => {
        if (content.includes(target)) {
          console.log(`Found mention of "${target}" in conversation: ${d}`);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes(target)) {
              try {
                const obj = JSON.parse(line);
                console.log(`  Step ${obj.step_index}, Source: ${obj.source}, Type: ${obj.type}`);
              } catch (e) {
                console.log(`  Line ${idx + 1} (Non-JSON match)`);
              }
            }
          });
        }
      });
    }
  });
} catch (err) {
  console.error('Error scanning transcripts:', err.message);
}
