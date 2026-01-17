#!/usr/bin/env python3
"""
Resolve merge conflicts by prioritizing ESM patterns (#app/#api/#shared) over relative imports.
For non-import conflicts, prefer production version.
"""

import re
import sys
import subprocess
from pathlib import Path

def convert_relative_to_esm(import_line, file_path):
    """Convert relative imports to ESM patterns based on file location."""
    # Remove quotes and extract path
    match = re.search(r"from\s+['\"](.+?)['\"]", import_line)
    if not match:
        return import_line
    
    import_path = match.group(1)
    
    # Skip if already ESM or external package
    if import_path.startswith('#') or not import_path.startswith('.'):
        return import_line
    
    # Determine base prefix based on file location
    file_str = str(file_path)
    if '/app/api/' in file_str:
        prefix = '#api'
        base_path = 'app/api'
    elif '/app/react/' in file_str:
        prefix = '#app'
        base_path = 'app/react'
    elif '/app/shared/' in file_str:
        prefix = '#shared'
        base_path = 'app/shared'
    else:
        return import_line
    
    # Convert relative path to absolute
    file_dir = Path(file_path).parent
    if import_path.startswith('./'):
        target = file_dir / import_path[2:]
    elif import_path.startswith('../'):
        parts = import_path.split('/')
        up_levels = sum(1 for p in parts if p == '..')
        target = file_dir
        for _ in range(up_levels):
            target = target.parent
        target = target / '/'.join(p for p in parts if p != '..')
    else:
        return import_line
    
    # Convert to relative path from base
    try:
        rel_path = target.relative_to(Path(base_path))
        esm_path = f"{prefix}/{rel_path}".replace('\\', '/')
        # Add .js extension if not present
        if not esm_path.endswith('.js') and not esm_path.endswith('.ts') and not esm_path.endswith('.tsx'):
            esm_path += '.js'
        return re.sub(r"from\s+['\"].+?['\"]", f"from '{esm_path}'", import_line)
    except ValueError:
        return import_line

def has_esm_pattern(text):
    """Check if text contains ESM import patterns."""
    return bool(re.search(r'#(app|api|shared|UI|V2)/', text))

def resolve_conflicts_in_file(file_path):
    """Resolve conflicts in a single file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<<<<<<< HEAD' not in content:
        return False
    
    lines = content.split('\n')
    output = []
    i = 0
    changed = False
    
    while i < len(lines):
        if lines[i].startswith('<<<<<<< HEAD'):
            # Found conflict start
            head_lines = []
            production_lines = []
            i += 1
            
            # Collect HEAD lines
            while i < len(lines) and not lines[i].startswith('======='):
                head_lines.append(lines[i])
                i += 1
            
            if i < len(lines) and lines[i].startswith('======='):
                i += 1
                # Collect production lines
                while i < len(lines) and not lines[i].startswith('>>>>>>>'):
                    production_lines.append(lines[i])
                    i += 1
            
            if i < len(lines) and lines[i].startswith('>>>>>>>'):
                i += 1
                
                head_text = '\n'.join(head_lines)
                prod_text = '\n'.join(production_lines)
                
                # Check for import conflicts
                if 'import' in head_text or 'import' in prod_text:
                    # Prefer ESM patterns
                    if has_esm_pattern(head_text):
                        # Use HEAD but convert any relative imports in it
                        for line in head_lines:
                            if 'import' in line and 'from' in line:
                                line = convert_relative_to_esm(line, file_path)
                            output.append(line)
                    elif has_esm_pattern(prod_text):
                        # Use production but convert relative imports
                        for line in production_lines:
                            if 'import' in line and 'from' in line:
                                line = convert_relative_to_esm(line, file_path)
                            output.append(line)
                    else:
                        # Neither has ESM, prefer production and convert
                        for line in production_lines:
                            if 'import' in line and 'from' in line:
                                line = convert_relative_to_esm(line, file_path)
                            output.append(line)
                    changed = True
                else:
                    # Non-import conflict, prefer production
                    output.extend(production_lines)
                    changed = True
            else:
                # Malformed conflict, keep as is
                output.append(lines[i-1])
        else:
            output.append(lines[i])
            i += 1
    
    if changed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(output))
        return True
    return False

def main():
    """Main function to resolve all conflicts."""
    result = subprocess.run(['git', 'diff', '--name-only', '--diff-filter=U'], 
                          capture_output=True, text=True)
    conflicted_files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
    
    print(f"Found {len(conflicted_files)} conflicted files")
    
    resolved = 0
    for file_path in conflicted_files:
        if file_path.endswith(('.ts', '.tsx', '.js', '.jsx')):
            if resolve_conflicts_in_file(file_path):
                print(f"Resolved: {file_path}")
                resolved += 1
    
    print(f"\nResolved {resolved} files automatically.")
    print("Please review and manually resolve remaining conflicts if needed.")

if __name__ == '__main__':
    main()
