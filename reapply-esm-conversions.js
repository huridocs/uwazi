#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

console.log('🔄 Re-applying ESM conversions to new files...\n');

// Function to get files that were added from production
function getNewFilesFromProduction() {
    try {
        // Get files that were added in the merge
        const addedFiles = execSync('git diff --name-only --diff-filter=A origin/production..HEAD', { encoding: 'utf8' });
        return addedFiles.trim().split('\n').filter(f => f.trim());
    } catch (error) {
        console.log('ℹ️  No new files from production');
        return [];
    }
}

// Function to get files that were modified in the merge
function getModifiedFilesFromProduction() {
    try {
        // Get files that were modified in the merge
        const modifiedFiles = execSync('git diff --name-only --diff-filter=M origin/production..HEAD', { encoding: 'utf8' });
        return modifiedFiles.trim().split('\n').filter(f => f.trim());
    } catch (error) {
        console.log('ℹ️  No modified files from production');
        return [];
    }
}

// Function to check if a file has path aliases
function hasPathAliases(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return /from\s+['"](?:api\/|shared\/|app\/)([^'"]+)['"]/g.test(content);
    } catch (error) {
        return false;
    }
}

// Function to convert path aliases (reuse our existing logic)
function convertPathAlias(filePath, aliasPath) {
    const isApiFile = filePath.includes('app/api/');
    const isSharedFile = filePath.includes('app/shared/');
    const isReactFile = filePath.includes('app/react/');

    if (aliasPath.startsWith('api/')) {
        const apiPath = aliasPath.substring(4);
        if (isApiFile) {
            return `../${apiPath}.js`;
        } else if (isSharedFile) {
            return `../api/${apiPath}.js`;
        } else if (isReactFile) {
            return `../../api/${apiPath}.js`;
        }
    }
    if (aliasPath.startsWith('shared/')) {
        const sharedPath = aliasPath.substring(7);
        if (isApiFile) {
            return `../../shared/${sharedPath}.js`;
        } else if (isSharedFile) {
            return `./${sharedPath}.js`;
        } else if (isReactFile) {
            return `../../shared/${sharedPath}.js`;
        }
    }
    if (aliasPath.startsWith('app/')) {
        const appPath = aliasPath.substring(4);
        if (isReactFile) {
            return `../../${appPath}.js`;
        }
    }
    return null;
}

// Function to fix path aliases in a file
function fixPathAliasesInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let replacements = 0;

        // Replace path aliases
        const modifiedContent = content.replace(
            /from\s+['"](?:api\/|shared\/|app\/)([^'"]+)['"]/g,
            (match, aliasPath) => {
                const fullAlias = match.includes('api/') ? `api/${aliasPath}` :
                                 match.includes('shared/') ? `shared/${aliasPath}` :
                                 match.includes('app/') ? `app/${aliasPath}` : aliasPath;

                const replacement = convertPathAlias(filePath, fullAlias);
                if (replacement) {
                    replacements++;
                    const quote = match.includes("'") ? "'" : '"';
                    return match.replace(/['"][^'"]+['"]/, `${quote}${replacement}${quote}`);
                }
                return match;
            }
        );

        if (replacements > 0) {
            fs.writeFileSync(filePath, modifiedContent);
            console.log(`  ✅ Fixed ${replacements} path aliases in ${filePath}`);
            return replacements;
        }

        return 0;
    } catch (error) {
        console.log(`  ⚠️  Could not process ${filePath}: ${error.message}`);
        return 0;
    }
}

// Function to add .js extensions to local imports
function addJsExtensions(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let replacements = 0;

        // Add .js extensions to local imports
        const modifiedContent = content.replace(
            /from\s+['"](\.\.?\/[^'"]+)(?<!\.js)['"]/g,
            (match, importPath) => {
                if (!importPath.endsWith('.js') && !importPath.endsWith('.ts') && !importPath.endsWith('.tsx')) {
                    replacements++;
                    return match.replace(importPath, `${importPath}.js`);
                }
                return match;
            }
        );

        if (replacements > 0) {
            fs.writeFileSync(filePath, modifiedContent);
            console.log(`  ✅ Added ${replacements} .js extensions in ${filePath}`);
            return replacements;
        }

        return 0;
    } catch (error) {
        console.log(`  ⚠️  Could not process ${filePath}: ${error.message}`);
        return 0;
    }
}

// Main function
function reapplyESMConversions() {
    console.log('📋 Analyzing files from production merge...\n');

    // Get new and modified files
    const newFiles = getNewFilesFromProduction();
    const modifiedFiles = getModifiedFilesFromProduction();
    const allFiles = [...newFiles, ...modifiedFiles];

    if (allFiles.length === 0) {
        console.log('✅ No files from production to process');
        return;
    }

    console.log(`📊 Found ${allFiles.length} files from production:`);
    allFiles.forEach(file => console.log(`  - ${file}`));
    console.log('');

    let totalReplacements = 0;
    let processedFiles = 0;

    // Process each file
    for (const file of allFiles) {
        if (!file.endsWith('.js') && !file.endsWith('.ts') && !file.endsWith('.tsx')) {
            continue;
        }

        console.log(`🔧 Processing: ${file}`);
        
        // Check if file has path aliases
        if (hasPathAliases(file)) {
            const pathAliasReplacements = fixPathAliasesInFile(file);
            totalReplacements += pathAliasReplacements;
        }

        // Add .js extensions
        const jsExtensionReplacements = addJsExtensions(file);
        totalReplacements += jsExtensionReplacements;

        if (pathAliasReplacements > 0 || jsExtensionReplacements > 0) {
            processedFiles++;
        }
    }

    console.log('\n🎉 ESM conversions re-applied!');
    console.log(`📊 Summary:`);
    console.log(`  - Files processed: ${processedFiles}`);
    console.log(`  - Total replacements: ${totalReplacements}`);
    console.log(`  - Path aliases fixed: ${totalReplacements - jsExtensionReplacements}`);
    console.log(`  - .js extensions added: ${jsExtensionReplacements}`);
}

// Run the re-application
reapplyESMConversions();
