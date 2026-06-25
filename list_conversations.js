const fs = require('fs');
const parentDir = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain';
try {
  const dirs = fs.readdirSync(parentDir);
  console.log('Subdirectories under brain:');
  dirs.forEach(d => {
    const p = `${parentDir}\\${d}`;
    try {
      const stats = fs.statSync(p);
      if (stats.isDirectory()) {
        console.log(`- ${d}`);
      }
    } catch (e) {}
  });
} catch (err) {
  console.error('Error listing directories:', err.message);
}
