import json

log_path = r"C:\Users\sudha\.gemini\antigravity-ide\brain\d024a500-b64a-4680-a5b5-648c698c05fe\.system_generated\logs\transcript.jsonl"
edits = []

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        if obj.get('type') == 'CODE_ACTION':
            content = obj.get('content', '')
            source = obj.get('source', '')
            step = obj.get('step_index', 0)
            
            # Extract target file path
            target_file = ""
            if "changes were made" in content:
                parts = content.split("to: ")
                if len(parts) > 1:
                    target_file = parts[1].split("\n")[0].strip()
            elif "TargetFile" in content:
                # might be JSON inside content
                pass
            
            edits.append({
                "step": step,
                "source": source,
                "target_file": target_file,
                "content": content
            })

print(f"Found {len(edits)} code actions.")
# Print details for first few
for e in edits:
    print(f"Step: {e['step']}, Source: {e['source']}, Target: {e['target_file']}")
    # print first 3 lines of content
    lines = e['content'].split('\n')
    print("Content preview:")
    for l in lines[:5]:
        print("  ", l)
    print("-" * 50)
