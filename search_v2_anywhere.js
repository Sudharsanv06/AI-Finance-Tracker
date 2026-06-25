const fs = require('fs');
const path = require('path');

function searchDir(dir, filter) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          results = results.concat(searchDir(filePath, filter));
        } else if (file.toLowerCase().includes(filter.toLowerCase())) {
          results.push(filePath);
        }
      } catch (err) {}
    });
  } catch (err) {}
  return results;
}

console.log("Searching workspace...");
const wsResults = searchDir("c:\\Users\\sudha\\OneDrive\\Desktop\\MAIN", "v2");
console.log("Workspace matches:", wsResults);

console.log("Searching gemini brain directory...");
const brainResults = searchDir("C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain", "v2");
console.log("Brain matches:", brainResults);
