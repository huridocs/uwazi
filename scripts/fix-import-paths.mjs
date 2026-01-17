#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const knownMappings = {
  '#app/uploadProgressAtom': 'app/react/V2/Routes/Settings/CustomUploads/components/uploadProgressAtom.ts',
  '#app/files/index': 'app/react/files/index.ts',
  '#app/V2/api/settings': 'app/react/V2/api/settings.ts',
  '#shared/formatHelpers': 'app/shared/formatHelpers.js',
  '#app/FiltersTable': 'app/react/FiltersTable/index.ts',
  '#app/components/ExtractorModal': 'app/react/components/ExtractorModal.js',
  '#app/components/TableElements': 'app/react/components/TableElements.js',
  '#app/components/List': 'app/react/components/List.js',
  '#app/components/SuggestionsTitle': 'app/react/components/SuggestionsTitle.js',
  '#app/components/FiltersSidepanel': 'app/react/components/FiltersSidepanel.js',
  '#app/helpers/index': 'app/react/helpers/index.js',
  '#app/types': 'app/react/types/index.ts',
  '#app/hooks/useEventHandler': 'app/react/hooks/useEventHandler.ts',
  '#app/components/atoms': 'app/react/components/atoms/index.ts',
  '#app/components/sidepanel/PDFSidepanel': 'app/react/components/sidepanel/PDFSidepanel.tsx',
  '#app/components/sidepanel/PropertySidepanel': 'app/react/components/sidepanel/PropertySidepanel.tsx',
  '#app/components/TrainModelModal': 'app/react/components/TrainModelModal.js',
  '#app/components/ProcessExtractorModal': 'app/react/components/ProcessExtractorModal.js',
  '#app/helpers/loaderHelper': 'app/react/helpers/loaderHelper.js',
  '#app/components/InstallLanguagesModal': 'app/react/components/InstallLanguagesModal.js',
  '#app/components/TableComponents': 'app/react/components/TableComponents.js',
  '#app/components/MenuForm': 'app/react/components/MenuForm.js',
  '#app/shared': 'app/react/shared/index.ts',
  '#app/PageEditor': 'app/react/PageEditor/index.ts',
  '#app/PagesList': 'app/react/PagesList/index.ts',
  '#shared/ParagraphExtractionTypes': 'app/shared/ParagraphExtractionTypes.js',
  '#app/components/entities/Table': 'app/react/components/entities/Table.js',
  '#app/utils/generateDisplayPill': 'app/react/utils/generateDisplayPill.js',
  '#app/components/entities/ExtractEntitiesDialog/index': 'app/react/components/entities/ExtractEntitiesDialog/index.js',
  '#app/components/FilterSidePanel/EntityFilterSidepanel': 'app/react/components/FilterSidePanel/EntityFilterSidepanel.js',
  '#app/components/FilterSidePanel/filterSidepanelAtom': 'app/react/components/FilterSidePanel/filterSidepanelAtom.js',
  '#app/components/paragraphs/Table': 'app/react/components/paragraphs/Table.js',
  '#app/components/paragraphs/ViewParagraphSidePanel': 'app/react/components/paragraphs/ViewParagraphSidePanel.js',
  '#app/components/paragraphs/PDFSidepanel': 'app/react/components/paragraphs/PDFSidepanel.js',
  '#app/utils/formatters': 'app/react/utils/formatters.js',
  '#app/components/extractors/CreateDialog/index': 'app/react/components/extractors/CreateDialog/index.js',
  '#app/components/extractors/Table': 'app/react/components/extractors/Table.js',
  '#app/components/extractors/DeleteDialog/index': 'app/react/components/extractors/DeleteDialog/index.js',
  '#app/preserve/index': 'app/react/preserve/index.js',
  '#app/components/Form': 'app/react/components/Form/index.js',
  '#app/SettingsNavigation': 'app/react/SettingsNavigation/index.ts',
  '#app/Templates': 'app/react/Templates/index.ts',
  '#app/V2/Components/CodeEditor': 'app/react/V2/Components/CodeEditor.tsx',
};

function convertToESMPath(filePath) {
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  
  if (relativePath.startsWith('app/react/')) {
    return '#app/' + relativePath.slice(10);
  }
  if (relativePath.startsWith('app/api/')) {
    return '#api/' + relativePath.slice(8);
  }
  if (relativePath.startsWith('app/shared/')) {
    return '#shared/' + relativePath.slice(11);
  }
  
  return null;
}

function findFile(importPath) {
  const cleanPath = importPath.replace(/^#(app|api|shared)\//, '').replace(/\.(js|ts|tsx|jsx)$/, '');
  
  if (importPath.startsWith('#app/')) {
    const baseDir = path.join(projectRoot, 'app/react');
    const possiblePaths = [
      path.join(baseDir, cleanPath + '.ts'),
      path.join(baseDir, cleanPath + '.tsx'),
      path.join(baseDir, cleanPath + '.js'),
      path.join(baseDir, cleanPath + '.jsx'),
      path.join(baseDir, cleanPath, 'index.ts'),
      path.join(baseDir, cleanPath, 'index.tsx'),
      path.join(baseDir, cleanPath, 'index.js'),
      path.join(baseDir, cleanPath, 'index.jsx'),
    ];
    
    for (const possiblePath of possiblePaths) {
      if (existsSync(possiblePath)) {
        return possiblePath;
      }
    }
  }
  
  if (importPath.startsWith('#api/')) {
    const baseDir = path.join(projectRoot, 'app/api');
    const possiblePaths = [
      path.join(baseDir, cleanPath + '.ts'),
      path.join(baseDir, cleanPath + '.tsx'),
      path.join(baseDir, cleanPath + '.js'),
      path.join(baseDir, cleanPath + '.jsx'),
      path.join(baseDir, cleanPath, 'index.ts'),
      path.join(baseDir, cleanPath, 'index.tsx'),
      path.join(baseDir, cleanPath, 'index.js'),
      path.join(baseDir, cleanPath, 'index.jsx'),
    ];
    
    for (const possiblePath of possiblePaths) {
      if (existsSync(possiblePath)) {
        return possiblePath;
      }
    }
  }
  
  if (importPath.startsWith('#shared/')) {
    const baseDir = path.join(projectRoot, 'app/shared');
    const possiblePaths = [
      path.join(baseDir, cleanPath + '.ts'),
      path.join(baseDir, cleanPath + '.tsx'),
      path.join(baseDir, cleanPath + '.js'),
      path.join(baseDir, cleanPath + '.jsx'),
      path.join(baseDir, cleanPath, 'index.ts'),
      path.join(baseDir, cleanPath, 'index.tsx'),
      path.join(baseDir, cleanPath, 'index.js'),
      path.join(baseDir, cleanPath, 'index.jsx'),
    ];
    
    for (const possiblePath of possiblePaths) {
      if (existsSync(possiblePath)) {
        return possiblePath;
      }
    }
  }
  
  return null;
}

function fixImportsInFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let modified = false;
  let newContent = content;

  const importRegex = /from\s+['"]([^'"]+)['"]/g;

  newContent = newContent.replace(importRegex, (match, importPath) => {
    if (!importPath.startsWith('#app/') && !importPath.startsWith('#api/') && !importPath.startsWith('#shared/')) {
      return match;
    }

    const cleanImport = importPath.replace(/\.(js|ts|tsx|jsx)$/, '');
    
    if (knownMappings[cleanImport]) {
      const correctPath = convertToESMPath(path.join(projectRoot, knownMappings[cleanImport]));
      if (correctPath && correctPath !== importPath) {
        const actualFile = path.join(projectRoot, knownMappings[cleanImport]);
        const ext = path.extname(actualFile);
        const finalPath = correctPath + ext;
        modified = true;
        return match.replace(importPath, finalPath);
      }
    }

    const foundFile = findFile(importPath);
    if (foundFile) {
      const correctPath = convertToESMPath(foundFile);
      if (correctPath && correctPath !== importPath) {
        const ext = path.extname(foundFile);
        const finalPath = correctPath + ext;
        modified = true;
        return match.replace(importPath, finalPath);
      }
    }

    return match;
  });

  if (modified) {
    writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

async function main() {
  console.log('🔍 Finding files with incorrect import paths...');

  const patterns = [
    'app/**/*.{js,jsx,ts,tsx}',
  ];

  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd: projectRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**'],
    });
    files.push(...matches);
  }

  console.log(`📁 Found ${files.length} files to check`);

  let fixedCount = 0;
  for (const file of files) {
    try {
      if (fixImportsInFile(file)) {
        fixedCount++;
        console.log(`✅ Fixed: ${path.relative(projectRoot, file)}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n✨ Fixed ${fixedCount} files`);
}

main().catch(console.error);
