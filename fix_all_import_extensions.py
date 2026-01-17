#!/usr/bin/env python3
"""
Fix all import extensions in app files to match actual file extensions.
Converts #app/ and #shared/ imports from .js to correct extensions.
"""

import re
import os
from pathlib import Path

BASE_DIR = Path('/home/mercy/Projects/uwazi')

def find_file_with_extension(import_path):
    """Find the actual file with any extension."""
    # Remove .js extension if present
    clean_path = import_path
    if clean_path.endswith('.js'):
        clean_path = clean_path[:-3]
    
    # Determine base directory
    if clean_path.startswith('#app/'):
        base = BASE_DIR / 'app/react'
        rel_path = clean_path[5:]  # Remove '#app/'
    elif clean_path.startswith('#shared/'):
        base = BASE_DIR / 'app/shared'
        rel_path = clean_path[8:]  # Remove '#shared/'
    elif clean_path.startswith('#api/'):
        base = BASE_DIR / 'app/api'
        rel_path = clean_path[5:]  # Remove '#api/'
    else:
        return None
    
    # Try common extensions
    for ext in ['.tsx', '.ts', '.jsx', '.js']:
        full_path = base / (rel_path + ext)
        if full_path.exists():
            return ext[1:]  # Return without the dot
    
    # Try with index
    for ext in ['.tsx', '.ts', '.jsx', '.js']:
        full_path = base / rel_path / ('index' + ext)
        if full_path.exists():
            return rel_path + '/index' + ext
    
    return None

def fix_imports_in_file(file_path):
    """Fix imports in a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return False
    
    lines = content.split('\n')
    new_lines = []
    changed = False
    
    for line in lines:
        # Match #app/, #shared/, #api/ imports with .js extension
        matches = re.finditer(r"from\s+['\"](#(?:app|shared|api)/[^'\"]+\.js)['\"]", line)
        new_line = line
        for match in matches:
            import_path = match.group(1)
            actual_file = find_file_with_extension(import_path)
            
            if actual_file and not actual_file.endswith('.js'):
                # Replace .js with actual extension
                if actual_file.startswith(import_path.replace('.js', '')):
                    new_import = '#' + actual_file
                else:
                    new_import = import_path.replace('.js', f'.{actual_file.split(".")[-1]}')
                new_line = new_line.replace(import_path, new_import)
                changed = True
        
        new_lines.append(new_line)
    
    if changed:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(new_lines))
            return True
        except Exception:
            return False
    
    return False

def main():
    """Main function."""
    import subprocess
    
    # Get all files in app
    result = subprocess.run(
        ['find', 'app', '-type', 'f', '(', '-name', '*.ts', '-o', '-name', '*.tsx', '-o', '-name', '*.js', '-o', '-name', '*.jsx', ')', '!', '-path', '*/specs/*', '!', '-path', '*/node_modules/*'],
        capture_output=True,
        text=True,
        cwd=str(BASE_DIR)
    )
    
    files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
    
    print(f"Found {len(files)} files to process")
    
    converted = 0
    for file_path in files:
        full_path = BASE_DIR / file_path
        if fix_imports_in_file(full_path):
            converted += 1
            if converted % 100 == 0:
                print(f"Converted {converted} files...")
    
    print(f"\nConverted {converted} files")

if __name__ == '__main__':
    main()
