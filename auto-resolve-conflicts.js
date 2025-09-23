#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Auto-resolving merge conflicts...\n');

// Function to get conflicted files
function getConflictedFiles() {
    try {
        const conflictFiles = execSync('git diff --name-only --diff-filter=U', { encoding: 'utf8' });
        return conflictFiles.trim().split('\n').filter(f => f.trim());
    } catch (error) {
        return [];
    }
}

// Function to resolve import conflicts in TypeScript/JavaScript files
function resolveImportConflicts(filePath) {
    console.log(`🔧 Resolving imports in ${filePath}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let resolved = [];
    let inConflict = false;
    let ourVersion = '';
    let theirVersion = '';
    let conflictStart = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('<<<<<<< HEAD')) {
            inConflict = true;
            conflictStart = true;
            continue;
        } else if (line.includes('=======')) {
            inConflict = false;
            continue;
        } else if (line.includes('>>>>>>>')) {
            inConflict = false;
            conflictStart = false;
            
            // Resolve the conflict by keeping our ESM version and adding new imports from production
            const resolvedConflict = resolveImportConflict(ourVersion, theirVersion);
            resolved.push(resolvedConflict);
            ourVersion = '';
            theirVersion = '';
            continue;
        }
        
        if (inConflict) {
            ourVersion += line + '\n';
        } else if (conflictStart && line.includes('>>>>>>>')) {
            theirVersion += line + '\n';
        } else {
            resolved.push(line);
        }
    }
    
    // Write resolved content
    fs.writeFileSync(filePath, resolved.join('\n'));
    console.log(`✅ Resolved ${filePath}`);
}

// Function to resolve import conflicts
function resolveImportConflict(ourVersion, theirVersion) {
    // Keep our ESM version (with .js extensions and relative paths)
    let resolved = ourVersion;
    
    // Extract new imports from production that we don't have
    const ourImports = extractImports(ourVersion);
    const theirImports = extractImports(theirVersion);
    
    // Find new imports from production
    const newImports = theirImports.filter(imp => 
        !ourImports.some(ourImp => ourImp.name === imp.name)
    );
    
    // Convert new imports to ESM format and add them
    for (const newImport of newImports) {
        const esmImport = convertToESMImport(newImport);
        if (esmImport) {
            resolved += esmImport + '\n';
        }
    }
    
    return resolved;
}

// Function to extract imports from a version
function extractImports(version) {
    const imports = [];
    const lines = version.split('\n');
    
    for (const line of lines) {
        if (line.trim().startsWith('import')) {
            const match = line.match(/import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/);
            if (match) {
                const names = match[1].split(',').map(n => n.trim());
                const from = match[2];
                
                for (const name of names) {
                    imports.push({ name, from });
                }
            }
        }
    }
    
    return imports;
}

// Function to convert import to ESM format
function convertToESMImport(importObj) {
    const { name, from } = importObj;
    
    // Convert path aliases to relative paths
    let relativePath = from;
    if (from.startsWith('api/')) {
        relativePath = `../../${from}.js`;
    } else if (from.startsWith('shared/')) {
        relativePath = `../../shared/${from.substring(7)}.js`;
    } else if (from.startsWith('app/')) {
        relativePath = `../../${from}.js`;
    } else if (from.startsWith('../')) {
        relativePath = `${from}.js`;
    }
    
    return `import { ${name} } from '${relativePath}';`;
}

// Function to resolve package.json conflicts
function resolvePackageJsonConflicts(filePath) {
    console.log(`🔧 Resolving package.json conflicts...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let resolved = [];
    let inConflict = false;
    let ourVersion = '';
    let theirVersion = '';
    
    for (const line of lines) {
        if (line.includes('<<<<<<< HEAD')) {
            inConflict = true;
            continue;
        } else if (line.includes('=======')) {
            inConflict = false;
            continue;
        } else if (line.includes('>>>>>>>')) {
            inConflict = false;
            // For package.json, keep production version but preserve our ESM changes
            const resolvedConflict = resolvePackageJsonConflict(ourVersion, theirVersion);
            resolved.push(resolvedConflict);
            ourVersion = '';
            theirVersion = '';
            continue;
        }
        
        if (inConflict) {
            ourVersion += line + '\n';
        } else if (line.includes('>>>>>>>')) {
            theirVersion += line + '\n';
        } else {
            resolved.push(line);
        }
    }
    
    fs.writeFileSync(filePath, resolved.join('\n'));
    console.log(`✅ Resolved ${filePath}`);
}

// Function to resolve package.json conflict
function resolvePackageJsonConflict(ourVersion, theirVersion) {
    try {
        const ourJson = JSON.parse(ourVersion);
        const theirJson = JSON.parse(theirVersion);
        
        // Preserve our ESM changes
        const esmChanges = {
            type: 'module'
        };
        
        // Merge the versions, preserving our ESM changes
        const merged = { ...theirJson, ...ourJson, ...esmChanges };
        
        return JSON.stringify(merged, null, 2);
    } catch (error) {
        console.log(`  ⚠️  Could not parse JSON, using our version`);
        return ourVersion;
    }
}

// Main resolution function
function resolveConflicts() {
    const conflictedFiles = getConflictedFiles();
    
    if (conflictedFiles.length === 0) {
        console.log('✅ No conflicts detected.');
        return;
    }
    
    console.log(`📋 Found ${conflictedFiles.length} conflicted files:`);
    conflictedFiles.forEach(file => console.log(`  - ${file}`));
    console.log('');
    
    for (const file of conflictedFiles) {
        console.log(`🔧 Processing: ${file}`);
        
        if (file === 'package.json') {
            resolvePackageJsonConflicts(file);
        } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx')) {
            resolveImportConflicts(file);
        } else {
            // For other files, keep our version
            console.log(`  ⚠️  Manual resolution needed for ${file}`);
        }
    }
    
    console.log('\n🎉 Conflict resolution completed!');
    console.log('📝 Next steps:');
    console.log('1. Review the resolved files');
    console.log('2. Run: git add <resolved-files>');
    console.log('3. Run: git commit -m "Resolve conflicts with ESM migration"');
    console.log('4. Test the application');
}

// Run the resolution
resolveConflicts();
