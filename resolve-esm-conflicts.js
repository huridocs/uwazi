#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 ESM Conflict Resolution Tool\n');

// Function to get conflicted files
function getConflictedFiles() {
    try {
        const conflictFiles = execSync('git diff --name-only --diff-filter=U', { encoding: 'utf8' });
        return conflictFiles.trim().split('\n').filter(f => f.trim());
    } catch (error) {
        return [];
    }
}

// Function to resolve package.json conflicts
function resolvePackageJson(filePath) {
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
            // Resolve the conflict by merging both versions
            const resolvedConflict = mergePackageJsonVersions(ourVersion, theirVersion);
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
    
    // Write resolved content
    fs.writeFileSync(filePath, resolved.join('\n'));
    console.log(`✅ Resolved ${filePath}`);
}

// Merge package.json versions
function mergePackageJsonVersions(ourVersion, theirVersion) {
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

// Function to resolve tsconfig.json conflicts
function resolveTsconfig(filePath) {
    console.log(`🔧 Resolving tsconfig.json conflicts...`);
    
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
            // Resolve the conflict by merging both versions
            const resolvedConflict = mergeTsconfigVersions(ourVersion, theirVersion);
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

// Merge tsconfig.json versions
function mergeTsconfigVersions(ourVersion, theirVersion) {
    try {
        const ourJson = JSON.parse(ourVersion);
        const theirJson = JSON.parse(theirVersion);
        
        // Preserve our ESM changes
        const esmChanges = {
            module: 'ESNext',
            moduleResolution: 'NodeNext'
        };
        
        // Merge the versions, preserving our ESM changes
        const merged = { ...theirJson, ...ourJson, ...esmChanges };
        
        return JSON.stringify(merged, null, 2);
    } catch (error) {
        console.log(`  ⚠️  Could not parse JSON, using our version`);
        return ourVersion;
    }
}

// Function to resolve webpack conflicts
function resolveWebpack(filePath) {
    console.log(`🔧 Resolving webpack conflicts...`);
    
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
            // For webpack, we want to preserve our ESM changes
            resolved.push(ourVersion);
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

// Function to resolve babel conflicts
function resolveBabel(filePath) {
    console.log(`🔧 Resolving babel conflicts...`);
    
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
            // For babel, we want to preserve our ESM changes
            resolved.push(ourVersion);
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

// Function to resolve eslint conflicts
function resolveESLint(filePath) {
    console.log(`🔧 Resolving eslint conflicts...`);
    
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
            // For eslint, we want to preserve our ESM changes
            resolved.push(ourVersion);
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

// Function to resolve import path conflicts
function resolveImportPaths(filePath) {
    console.log(`🔧 Resolving import path conflicts...`);
    
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
            // For import paths, we want to preserve our ESM changes
            resolved.push(ourVersion);
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

// Main resolution logic
function resolveConflicts() {
    const conflictedFiles = getConflictedFiles();
    
    if (conflictedFiles.length === 0) {
        console.log('✅ No conflicts detected.');
        return;
    }
    
    console.log(`📋 Found ${conflictedFiles.length} conflicted files:`);
    conflictedFiles.forEach(file => console.log(`  - ${file}`));
    
    for (const file of conflictedFiles) {
        console.log(`\n🔧 Processing: ${file}`);
        
        if (file === 'package.json') {
            resolvePackageJson(file);
        } else if (file === 'tsconfig.json') {
            resolveTsconfig(file);
        } else if (file.includes('webpack')) {
            resolveWebpack(file);
        } else if (file.includes('babel')) {
            resolveBabel(file);
        } else if (file.includes('eslint')) {
            resolveESLint(file);
        } else {
            // For other files, preserve our ESM changes
            resolveImportPaths(file);
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
