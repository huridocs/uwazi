#!/usr/bin/env python3
"""
Fix import extensions in app/react files to match actual file extensions.
Converts #app/V2 imports from .js to .ts/.tsx based on actual files.
"""

import re
import os
from pathlib import Path

def find_file_with_extension(base_path, import_path):
    """Find the actual file with any extension."""
    base = Path(base_path)
    # Remove .js extension if present
    if import_path.endswith('.js'):
        import_path = import_path[:-3]
    
    # Try common extensions
    for ext in ['.tsx', '.ts', '.jsx', '.js']:
        full_path = base / (import_path + ext)
        if full_path.exists():
            return ext[1:]  # Return without the dot
    return None

def fix_imports_in_file(file_path):
    """Fix imports in a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False
    
    # Only process files in app/react
    if '/app/react/' not in str(file_path):
        return False
    
    base_path = Path('/home/mercy/Projects/uwazi/app/react')
    lines = content.split('\n')
    new_lines = []
    changed = False
    
    for line in lines:
        # Match #app/V2 imports with .js extension
        match = re.search(r"from\s+['\"](#app/V2[^'\"]+\.js)['\"]", line)
        if match:
            import_path = match.group(1)
            # Convert to relative path from app/react
            rel_path = import_path.replace('#app/', '')
            actual_ext = find_file_with_extension(base_path, rel_path)
            
            if actual_ext and actual_ext != 'js':
                new_import = import_path.replace('.js', f'.{actual_ext}')
                new_line = line.replace(import_path, new_import)
                new_lines.append(new_line)
                changed = True
            else:
                new_lines.append(line)
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
    
    # Get all files in app/react
    result = subprocess.run(
        ['find', 'app/react', '-type', 'f', '(', '-name', '*.ts', '-o', '-name', '*.tsx', '-o', '-name', '*.js', '-o', '-name', '*.jsx', ')', '!', '-path', '*/specs/*', '!', '-path', '*/node_modules/*'],
        capture_output=True,
        text=True,
        cwd='/home/mercy/Projects/uwazi'
    )
    
    files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
    
    print(f"Found {len(files)} files to process")
    
    converted = 0
    for file_path in files:
        full_path = Path('/home/mercy/Projects/uwazi') / file_path
        if fix_imports_in_file(full_path):
            converted += 1
            if converted % 50 == 0:
                print(f"Converted {converted} files...")
    
    print(f"\nConverted {converted} files")

if __name__ == '__main__':
    main()
