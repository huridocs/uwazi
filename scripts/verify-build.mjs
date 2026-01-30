#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..', '..');

const checks = {
  hot: {
    name: 'Hot Mode CSS',
    check: () => {
      const mainCss = join(__dirname, 'dist', 'CSS', 'main.css');
      return existsSync(mainCss);
    },
    message: 'Hot mode should generate CSS/main.css',
  },
  production: {
    name: 'Production CSS',
    check: () => {
      const assetsPath = join(__dirname, 'prod', 'dist', 'webpack-assets.json');
      if (!existsSync(assetsPath)) return false;
      const assets = JSON.parse(readFileSync(assetsPath, 'utf8'));
      return !!assets.main?.css;
    },
    message: 'Production build should have main.css in webpack-assets.json',
  },
  storybook: {
    name: 'Storybook Config',
    check: () => {
      const storybookConfig = join(__dirname, '.storybook', 'webpackConfigLoader.cjs');
      return existsSync(storybookConfig);
    },
    message: 'Storybook webpack config should exist',
  },
};

console.log('🔍 Verifying build configurations...\n');

let allPassed = true;
for (const [key, { name, check, message }] of Object.entries(checks)) {
  try {
    const passed = check();
    if (passed) {
      console.log(`✅ ${name}: PASS`);
    } else {
      console.log(`❌ ${name}: FAIL`);
      console.log(`   ${message}`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR`);
    console.log(`   ${error.message}`);
    allPassed = false;
  }
}

console.log('');
if (allPassed) {
  console.log('✅ All checks passed!');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the output above.');
  process.exit(1);
}
