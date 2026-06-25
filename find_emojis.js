const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      if (fs.statSync(dirFile).isDirectory()) {
        walkSync(dirFile, filelist);
      } else {
        filelist.push(dirFile);
      }
    } catch (err) {}
  });
  return filelist;
};

// Simple regex to match emoji characters (Unicode property escapes are supported in modern node)
const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;

const files = walkSync('mobile/src');
console.log(`Scanning ${files.length} files...`);

for (const file of files) {
  if (!file.endsWith('.js') && !file.endsWith('.jsx')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const matches = line.match(emojiRegex);
    if (matches) {
      console.log(`${file}:${idx + 1}: ${line.trim()} (Matches: ${matches.join(', ')})`);
    }
  });
}
