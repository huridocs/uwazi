import { readFileSync } from 'fs';

// Test the convertPathAlias function
function convertPathAlias(filePath, aliasPath) {
  const isApiFile = filePath.includes('app/api/');
  const isSharedFile = filePath.includes('app/shared/');
  const isReactFile = filePath.includes('app/react/');

  console.log(`File: ${filePath}`);
  console.log(`Alias: ${aliasPath}`);
  console.log(`isApiFile: ${isApiFile}, isSharedFile: ${isSharedFile}, isReactFile: ${isReactFile}`);

  // Handle api/ aliases
  if (aliasPath.startsWith('api/')) {
    const apiPath = aliasPath.substring(4); // Remove 'api/'
    if (isApiFile) {
      const result = `../${apiPath}.js`;
      console.log(`Result: ${result}`);
      return result;
    } else if (isSharedFile) {
      const result = `../api/${apiPath}.js`;
      console.log(`Result: ${result}`);
      return result;
    } else if (isReactFile) {
      const result = `../../api/${apiPath}.js`;
      console.log(`Result: ${result}`);
      return result;
    }
  }

  // Handle shared/ aliases
  if (aliasPath.startsWith('shared/')) {
    const sharedPath = aliasPath.substring(7); // Remove 'shared/'
    if (isApiFile) {
      const result = `../../shared/${sharedPath}.js`;
      console.log(`Result: ${result}`);
      return result;
    } else if (isSharedFile) {
      const result = `./${sharedPath}.js`;
      console.log(`Result: ${result}`);
      return result;
    } else if (isReactFile) {
      const result = `../../shared/${sharedPath}.js`;
      console.log(`Result: ${result}`);
      return result;
    }
  }

  // Handle app/ aliases (for React components)
  if (aliasPath.startsWith('app/')) {
    const appPath = aliasPath.substring(4); // Remove 'app/'
    if (isReactFile) {
      const result = `../../${appPath}.js`;
      console.log(`Result: ${result}`);
      return result;
    }
  }

  console.log(`No conversion needed`);
  return null; // No conversion needed
}

// Test with the actual file
const filePath = 'app/api/externalIntegrations.v2/automaticTranslation/specs/fixtures/SaveEntity.fixtures.js';
const aliasPath = 'api/utils/fixturesFactory';

console.log('Testing convertPathAlias function:');
convertPathAlias(filePath, aliasPath);
