import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';
import { glob } from 'glob';
import { execSync } from 'child_process';

const filesToConvert = await glob('app/react/**/*.js', {
  ignore: ['**/node_modules/**', '**/specs/**', '**/*.spec.js'],
});

const jsxFiles = [];

for (const file of filesToConvert) {
  const content = readFileSync(file, 'utf-8');
  
  const hasJSX = /<[A-Z]/.test(content) || 
                 /<\/[A-Z]/.test(content) || 
                 /return\s*\(?\s*</.test(content) ||
                 /React\.createElement/.test(content) ||
                 /from ['"]react['"]/.test(content) && /<[a-zA-Z]/.test(content);
  
  if (hasJSX) {
    jsxFiles.push(file);
  }
}

console.log(`Found ${jsxFiles.length} files with JSX to convert:\n`);

const converted = [];
const importsToUpdate = [];

for (const file of jsxFiles) {
  const newFile = file.replace(/\.js$/, '.jsx');
  
  if (existsSync(newFile)) {
    console.log(`⚠️  Skipping ${file} - ${newFile} already exists`);
    continue;
  }
  
  try {
    renameSync(file, newFile);
    converted.push({ old: file, new: newFile });
    console.log(`✅ Converted: ${file} → ${newFile}`);
    
    const basePath = file.replace(/^app\/react\//, '').replace(/\.js$/, '');
    importsToUpdate.push({
      old: `#app/${basePath}.js`,
      new: `#app/${basePath}.jsx`,
      oldAlt: `'#app/${basePath}.js'`,
      newAlt: `'#app/${basePath}.jsx'`,
      oldAlt2: `"#app/${basePath}.js"`,
      newAlt2: `"#app/${basePath}.jsx"`,
    });
  } catch (error) {
    console.error(`❌ Error converting ${file}:`, error.message);
  }
}

console.log(`\n✨ Converted ${converted.length} files`);

if (importsToUpdate.length > 0) {
  console.log(`\nUpdating imports...`);
  
  const allFiles = await glob('app/**/*.{js,jsx,ts,tsx,mjs}', {
    ignore: ['**/node_modules/**', '**/dist/**'],
  });
  
  let totalUpdated = 0;
  
  for (const targetFile of allFiles) {
    let content = readFileSync(targetFile, 'utf-8');
    let modified = false;
    
    for (const { old, new: newPath, oldAlt, newAlt, oldAlt2, newAlt2 } of importsToUpdate) {
      const patterns = [
        { from: new RegExp(`from\\s+${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), to: `from ${newPath}` },
        { from: new RegExp(`from\\s+${oldAlt}`, 'g'), to: `from ${newAlt}` },
        { from: new RegExp(`from\\s+${oldAlt2}`, 'g'), to: `from ${newAlt2}` },
        { from: new RegExp(`import\\s+.*from\\s+${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), to: (match) => match.replace(old, newPath) },
        { from: new RegExp(`require\\(${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), to: `require(${newPath})` },
        { from: new RegExp(`['"]${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'), to: (match) => match.replace(old, newPath) },
      ];
      
      for (const { from, to } of patterns) {
        const newContent = typeof to === 'function' ? content.replace(from, to) : content.replace(from, to);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    }
    
    if (modified) {
      writeFileSync(targetFile, content, 'utf-8');
      totalUpdated++;
    }
  }
  
  console.log(`✨ Updated imports in ${totalUpdated} files`);
}

console.log(`\n✅ Conversion complete!`);
