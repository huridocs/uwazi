import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

// Comprehensive path alias conversion function
function convertPathAlias(filePath, aliasPath) {
  const isApiFile = filePath.includes('app/api/');
  const isSharedFile = filePath.includes('app/shared/');
  const isReactFile = filePath.includes('app/react/');

  // Handle api/ aliases
  if (aliasPath.startsWith('api/')) {
    const apiPath = aliasPath.substring(4); // Remove 'api/'
    if (isApiFile) {
      return `../${apiPath}.js`;
    } else if (isSharedFile) {
      return `../api/${apiPath}.js`;
    } else if (isReactFile) {
      return `../../api/${apiPath}.js`;
    }
  }

  // Handle shared/ aliases
  if (aliasPath.startsWith('shared/')) {
    const sharedPath = aliasPath.substring(7); // Remove 'shared/'
    if (isApiFile) {
      return `../../shared/${sharedPath}.js`;
    } else if (isSharedFile) {
      return `./${sharedPath}.js`;
    } else if (isReactFile) {
      return `../../shared/${sharedPath}.js`;
    }
  }

  // Handle app/ aliases (for React components)
  if (aliasPath.startsWith('app/')) {
    const appPath = aliasPath.substring(4); // Remove 'app/'
    if (isReactFile) {
      return `../../${appPath}.js`;
    }
  }

  return null; // No conversion needed
}

async function fixRemainingAliases() {
  console.log('🔍 Finding files with remaining path aliases...');

  // Find all TypeScript and JavaScript files
  const files = await glob('**/*.{ts,js,tsx,jsx}', { 
    ignore: ['node_modules/**', 'dist/**', 'prod/**', '**/node_modules/**'] 
  });
  
  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      let modifiedContent = content;
      let fileReplacements = 0;

      // Check for path aliases using regex (both single and double quotes)
      const aliasPattern = /from\s+['"](?:api\/|shared\/|app\/)([^'"]+)['"]/g;
      const hasAliases = aliasPattern.test(content);

      if (!hasAliases) continue;

      console.log(`🔧 Processing: ${file}`);

      // Replace path aliases dynamically (handle both single and double quotes)
      modifiedContent = modifiedContent.replace(
        /from\s+['"](?:api\/|shared\/|app\/)([^'"]+)['"]/g,
        (match, aliasPath) => {
          const fullAlias = match.includes('api/') ? `api/${aliasPath}` :
                           match.includes('shared/') ? `shared/${aliasPath}` :
                           match.includes('app/') ? `app/${aliasPath}` : aliasPath;

          const replacement = convertPathAlias(file, fullAlias);
          if (replacement) {
            fileReplacements++;
            // Preserve the original quote style
            const quote = match.includes("'") ? "'" : '"';
            return match.replace(/['"][^'"]+['"]/, `${quote}${replacement}${quote}`);
          }
          return match;
        }
      );

      if (fileReplacements > 0) {
        writeFileSync(file, modifiedContent);
        console.log(`  ✅ Fixed ${fileReplacements} path aliases`);
        totalReplacements += fileReplacements;
        filesModified++;
      }
    } catch (error) {
      console.error(`❌ Error processing file ${file}:`, error);
    }
  }

  console.log(`\n🎉 Summary:\n   Files modified: ${filesModified}\n   Total replacements: ${totalReplacements}`);
}

fixRemainingAliases();
