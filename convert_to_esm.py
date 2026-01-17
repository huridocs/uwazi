#!/usr/bin/env python3
"""
Convert relative imports to ESM patterns (#app/#api/#shared) in files changed in production.
"""

import re
import sys
from pathlib import Path

def get_esm_prefix(file_path):
    """Determine ESM prefix based on file location."""
    file_str = str(file_path)
    if '/app/api/' in file_str:
        return '#api'
    elif '/app/react/UI/' in file_str:
        return '#UI'
    elif '/app/react/V2/' in file_str:
        return '#V2'
    elif '/app/react/' in file_str:
        return '#app'
    elif '/app/shared/' in file_str:
        return '#shared'
    return None

def resolve_relative_path(file_path, import_path):
    """Resolve relative import path to absolute path."""
    file_dir = Path(file_path).parent
    
    if import_path.startswith('./'):
        target = file_dir / import_path[2:]
    elif import_path.startswith('../'):
        parts = import_path.split('/')
        up_levels = sum(1 for p in parts if p == '..')
        target = file_dir
        for _ in range(up_levels):
            target = target.parent
        remaining = [p for p in parts if p != '..']
        if remaining:
            target = target / '/'.join(remaining)
    else:
        return None
    
    return target.resolve()

def convert_import_to_esm(file_path, import_line):
    """Convert a single import line to ESM pattern."""
    # Match import statements
    match = re.search(r"from\s+['\"](.+?)['\"]", import_line)
    if not match:
        return import_line
    
    import_path = match.group(1)
    
    # Skip if already ESM, external package, or absolute path
    if (import_path.startswith('#') or 
        not import_path.startswith('.') or
        import_path.startswith('/')):
        return import_line
    
    prefix = get_esm_prefix(file_path)
    if not prefix:
        return import_line
    
    # Resolve relative path
    resolved = resolve_relative_path(file_path, import_path)
    if not resolved or not resolved.exists():
        # Try to find the file
        if import_path.endswith('.js') or import_path.endswith('.ts'):
            # Keep as is if we can't resolve
            return import_line
        # Try adding .js extension
        for ext in ['.js', '/index.js', '.ts', '/index.ts']:
            test_path = resolve_relative_path(file_path, import_path + ext)
            if test_path and test_path.exists():
                resolved = test_path
                break
    
    if not resolved:
        return import_line
    
    # Determine base directory
    if '/app/api/' in str(file_path):
        base = Path('app/api')
    elif '/app/react/' in str(file_path):
        base = Path('app/react')
    elif '/app/shared/' in str(file_path):
        base = Path('app/shared')
    else:
        return import_line
    
    try:
        # Get relative path from base
        rel_path = resolved.relative_to(Path.cwd() / base)
        esm_path = f"{prefix}/{rel_path}".replace('\\', '/')
        
        # Remove extension for .ts/.tsx files, keep .js
        if esm_path.endswith('.ts'):
            esm_path = esm_path[:-3] + '.js'
        elif esm_path.endswith('.tsx'):
            esm_path = esm_path[:-4] + '.js'
        elif not esm_path.endswith('.js'):
            # Check if it's a directory (index file)
            if (resolved / 'index.js').exists() or (resolved / 'index.ts').exists():
                esm_path += '/index.js'
            else:
                esm_path += '.js'
        
        return re.sub(r"from\s+['\"].+?['\"]", f"from '{esm_path}'", import_line)
    except ValueError:
        return import_line

def convert_file(file_path):
    """Convert all relative imports in a file to ESM."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False
    
    lines = content.split('\n')
    new_lines = []
    changed = False
    
    for line in lines:
        if 'import' in line and 'from' in line:
            new_line = convert_import_to_esm(file_path, line)
            if new_line != line:
                changed = True
            new_lines.append(new_line)
        else:
            new_lines.append(line)
    
    if changed:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(new_lines))
            return True
        except Exception as e:
            print(f"Error writing {file_path}: {e}")
            return False
    
    return False

def main():
    """Main function."""
    import subprocess
    
    # Get merge base
    merge_base_result = subprocess.run(
        ['git', 'merge-base', 'HEAD', 'production'],
        capture_output=True,
        text=True
    )
    merge_base = merge_base_result.stdout.strip()
    
    # Get files changed in production
    result = subprocess.run(
        ['git', 'diff', '--name-only', merge_base, 'production'],
        capture_output=True,
        text=True
    )
    
    files = [f.strip() for f in result.stdout.split('\n') 
             if f.strip() and f.endswith(('.ts', '.tsx', '.js', '.jsx')) 
             and '/app/' in f and 'specs/' not in f]
    
    print(f"Found {len(files)} files to process")
    
    converted = 0
    for file_path in files:
        if Path(file_path).exists():
            if convert_file(file_path):
                print(f"Converted: {file_path}")
                converted += 1
    
    print(f"\nConverted {converted} files")

if __name__ == '__main__':
    main()
