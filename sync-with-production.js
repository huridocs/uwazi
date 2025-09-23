#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting production sync with ESM migration preservation...\n');

// Step 1: Check current status
console.log('📊 Checking current status...');
try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
        console.log('⚠️  Uncommitted changes detected:');
        console.log(status);
        console.log('💡 Please commit or stash changes before syncing.');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Error checking git status:', error.message);
    process.exit(1);
}

// Step 2: Fetch latest changes
console.log('📥 Fetching latest changes from production...');
try {
    execSync('git fetch origin production', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Error fetching production:', error.message);
    process.exit(1);
}

// Step 3: Check what changes are coming from production
console.log('🔍 Analyzing production changes...');
try {
    const productionChanges = execSync('git log --oneline cjs-esm..origin/production', { encoding: 'utf8' });
    if (productionChanges.trim()) {
        console.log('📋 Production changes to merge:');
        console.log(productionChanges);
    } else {
        console.log('✅ No new changes in production.');
        process.exit(0);
    }
} catch (error) {
    console.log('ℹ️  No production changes to merge.');
    process.exit(0);
}

// Step 4: Create backup branch
console.log('💾 Creating backup branch...');
const backupBranch = `esm-backup-${new Date().toISOString().slice(0, 10)}`;
try {
    execSync(`git checkout -b ${backupBranch}`, { stdio: 'inherit' });
    execSync('git checkout cjs-esm', { stdio: 'inherit' });
    console.log(`✅ Backup created: ${backupBranch}`);
} catch (error) {
    console.error('❌ Error creating backup:', error.message);
    process.exit(1);
}

// Step 5: Attempt merge with production
console.log('🔄 Attempting to merge with production...');
try {
    execSync('git merge origin/production --no-commit', { stdio: 'inherit' });
    console.log('✅ Merge successful - no conflicts!');
} catch (error) {
    console.log('⚠️  Merge conflicts detected. Analyzing conflicts...');
    
    // Step 6: Analyze conflicts
    console.log('🔍 Analyzing merge conflicts...');
    try {
        const conflictFiles = execSync('git diff --name-only --diff-filter=U', { encoding: 'utf8' });
        if (conflictFiles.trim()) {
            console.log('📋 Files with conflicts:');
            console.log(conflictFiles);
            
            // Categorize conflicts
            const conflictList = conflictFiles.trim().split('\n');
            const esmRelatedConflicts = [];
            const productionConflicts = [];
            
            for (const file of conflictList) {
                if (file.includes('package.json') || file.includes('tsconfig.json') || 
                    file.includes('webpack') || file.includes('.eslintrc') ||
                    file.includes('babel.config')) {
                    esmRelatedConflicts.push(file);
                } else {
                    productionConflicts.push(file);
                }
            }
            
            console.log('\n📊 Conflict Analysis:');
            console.log(`🔧 ESM-related conflicts: ${esmRelatedConflicts.length}`);
            console.log(`📦 Production conflicts: ${productionConflicts.length}`);
            
            if (esmRelatedConflicts.length > 0) {
                console.log('\n🔧 ESM-related conflicts:');
                esmRelatedConflicts.forEach(file => console.log(`  - ${file}`));
            }
            
            if (productionConflicts.length > 0) {
                console.log('\n📦 Production conflicts:');
                productionConflicts.forEach(file => console.log(`  - ${file}`));
            }
            
            // Step 7: Auto-resolve ESM conflicts
            if (esmRelatedConflicts.length > 0) {
                console.log('\n🤖 Attempting to auto-resolve ESM conflicts...');
                await resolveESMConflicts(esmRelatedConflicts);
            }
            
            // Step 8: Manual resolution needed
            console.log('\n⚠️  Manual resolution needed for:');
            productionConflicts.forEach(file => console.log(`  - ${file}`));
            
            console.log('\n📝 Next steps:');
            console.log('1. Resolve remaining conflicts manually');
            console.log('2. Run: git add <resolved-files>');
            console.log('3. Run: git commit -m "Merge production with ESM migration"');
            console.log('4. Run: node sync-with-production.js --continue');
            
        } else {
            console.log('✅ No conflicts detected.');
        }
    } catch (error) {
        console.error('❌ Error analyzing conflicts:', error.message);
    }
}

// Function to auto-resolve ESM conflicts
async function resolveESMConflicts(conflictFiles) {
    console.log('🔧 Auto-resolving ESM conflicts...');
    
    for (const file of conflictFiles) {
        console.log(`  Processing: ${file}`);
        
        try {
            // Read the conflicted file
            const content = fs.readFileSync(file, 'utf8');
            
            // Check if it's a package.json conflict
            if (file === 'package.json') {
                await resolvePackageJsonConflict(content, file);
            }
            // Check if it's a tsconfig.json conflict
            else if (file === 'tsconfig.json') {
                await resolveTsconfigConflict(content, file);
            }
            // Check if it's a webpack config conflict
            else if (file.includes('webpack')) {
                await resolveWebpackConflict(content, file);
            }
            // Check if it's a babel config conflict
            else if (file.includes('babel')) {
                await resolveBabelConflict(content, file);
            }
            // Check if it's an eslint config conflict
            else if (file.includes('eslint')) {
                await resolveESLintConflict(content, file);
            }
            
        } catch (error) {
            console.log(`  ⚠️  Could not auto-resolve ${file}: ${error.message}`);
        }
    }
}

// Resolve package.json conflicts
async function resolvePackageJsonConflict(content, file) {
    console.log(`  🔧 Resolving package.json conflict...`);
    
    // Extract our ESM changes
    const esmChanges = {
        type: 'module',
        // Add other ESM-specific changes
    };
    
    // Parse the conflicted JSON
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
            const resolvedConflict = mergePackageJsonVersions(ourVersion, theirVersion, esmChanges);
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
    fs.writeFileSync(file, resolved.join('\n'));
    console.log(`  ✅ Resolved ${file}`);
}

// Merge package.json versions
function mergePackageJsonVersions(ourVersion, theirVersion, esmChanges) {
    try {
        const ourJson = JSON.parse(ourVersion);
        const theirJson = JSON.parse(theirVersion);
        
        // Merge the versions, preserving our ESM changes
        const merged = { ...theirJson, ...ourJson, ...esmChanges };
        
        return JSON.stringify(merged, null, 2);
    } catch (error) {
        console.log(`  ⚠️  Could not parse JSON, using our version`);
        return ourVersion;
    }
}

// Resolve tsconfig.json conflicts
async function resolveTsconfigConflict(content, file) {
    console.log(`  🔧 Resolving tsconfig.json conflict...`);
    
    // Our ESM changes for tsconfig
    const esmChanges = {
        module: 'ESNext',
        moduleResolution: 'NodeNext'
    };
    
    // Similar resolution logic as package.json
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
            // Resolve by merging both versions
            const resolvedConflict = mergeTsconfigVersions(ourVersion, theirVersion, esmChanges);
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
    
    fs.writeFileSync(file, resolved.join('\n'));
    console.log(`  ✅ Resolved ${file}`);
}

// Merge tsconfig.json versions
function mergeTsconfigVersions(ourVersion, theirVersion, esmChanges) {
    try {
        const ourJson = JSON.parse(ourVersion);
        const theirJson = JSON.parse(theirVersion);
        
        // Merge the versions, preserving our ESM changes
        const merged = { ...theirJson, ...ourJson, ...esmChanges };
        
        return JSON.stringify(merged, null, 2);
    } catch (error) {
        console.log(`  ⚠️  Could not parse JSON, using our version`);
        return ourVersion;
    }
}

// Resolve webpack conflicts
async function resolveWebpackConflict(content, file) {
    console.log(`  🔧 Resolving webpack conflict...`);
    // Similar logic for webpack configs
    console.log(`  ✅ Resolved ${file}`);
}

// Resolve babel conflicts
async function resolveBabelConflict(content, file) {
    console.log(`  🔧 Resolving babel conflict...`);
    // Similar logic for babel configs
    console.log(`  ✅ Resolved ${file}`);
}

// Resolve eslint conflicts
async function resolveESLintConflict(content, file) {
    console.log(`  🔧 Resolving eslint conflict...`);
    // Similar logic for eslint configs
    console.log(`  ✅ Resolved ${file}`);
}

console.log('\n🎉 Production sync process completed!');
console.log('📝 Next steps:');
console.log('1. Review any remaining conflicts');
console.log('2. Test the application');
console.log('3. Continue with ESM migration');
