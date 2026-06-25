const fs = require('fs');
const readline = require('readline');

const logPath = "C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\6b2987cc-c5b5-46ec-89d7-0a73830e78d0\\.system_generated\\logs\\transcript.jsonl";

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

const extracted = {
  'ChatBot.jsx': { step: -1, content: '' },
  'AddTransactionScreen.jsx': { step: -1, content: '' },
  'helpers.js': { step: -1, content: '' },
  'BillRemindersScreen.jsx': { step: -1, content: '' }
};

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        const name = tc.name;
        const args = tc.args || {};
        let target = args.TargetFile || args.targetFile || args.AbsolutePath || '';
        
        // Strip quotes from target path
        target = target.replace(/^["'`]|["'`]$/g, '').trim();
        
        Object.keys(extracted).forEach(file => {
          if (target.endsWith(file)) {
            let code = args.CodeContent || args.codeContent || '';
            if (!code && name === 'replace_file_content') {
              code = args.ReplacementContent || '';
            }
            
            // Clean up code content quotes
            if (code) {
              let parsedCode = code;
              if (code.startsWith('"') || code.startsWith('`')) {
                try {
                  parsedCode = JSON.parse(code);
                } catch (e) {
                  try {
                    parsedCode = eval(code);
                  } catch (e2) {}
                }
              }
              
              // Only overwrite if it has a larger content or is a newer step
              if (parsedCode.length > 200) {
                // If it's a replace_file_content, it might not be the full file, but let's log it
                console.log(`Found candidate for ${file} in step ${obj.step_index} (${name}) length=${parsedCode.length}`);
                if (name === 'write_to_file' || parsedCode.length > extracted[file].content.length) {
                  extracted[file] = { step: obj.step_index, content: parsedCode };
                }
              }
            }
          }
        });
      });
    }
  } catch (e) {}
});

rl.on('close', () => {
  console.log('Extraction results:');
  Object.keys(extracted).forEach(file => {
    const info = extracted[file];
    if (info.content) {
      const base = file.replace('.jsx', '').replace('.js', '');
      let suffix = '';
      if (file === 'ChatBot.jsx') suffix = '_v3.jsx';
      else if (file === 'AddTransactionScreen.jsx') suffix = '_v2.jsx';
      else if (file === 'helpers.js') suffix = '_v2.js';
      else if (file === 'BillRemindersScreen.jsx') suffix = '_v2.jsx';
      
      const outPath = base + suffix;
      fs.writeFileSync(outPath, info.content, 'utf8');
      console.log(`- Extracted ${file} from step ${info.step} to ${outPath} (${info.content.length} chars)`);
    } else {
      console.log(`- Could not find full content for ${file}`);
    }
  });
});
