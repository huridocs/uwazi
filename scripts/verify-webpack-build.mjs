#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..', '..');

const results = {
  production: {
    passed: [],
    failed: [],
    warnings: [],
  },
  hot: {
    passed: [],
    failed: [],
    warnings: [],
  },
  general: {
    passed: [],
    failed: [],
    warnings: [],
  },
};

function checkProductionBuild() {
  console.log('\n📦 Production Build Verification:');
  console.log('='.repeat(50));

  const assetsPath = join(__dirname, 'prod', 'dist', 'webpack-assets.json');

  if (!existsSync(assetsPath)) {
    results.production.failed.push('webpack-assets.json does not exist');
    console.log('❌ webpack-assets.json not found');
    return;
  }

  results.production.passed.push('webpack-assets.json exists');
  console.log('✅ webpack-assets.json exists');

  try {
    const assets = JSON.parse(readFileSync(assetsPath, 'utf8'));

    const vendor = assets.vendor;
    const main = assets.main;
    const emptyKey = assets[''];

    if (vendor) {
      if (vendor.css) {
        const vendorCss = Array.isArray(vendor.css) ? vendor.css : [vendor.css];
        const hasLtr = vendorCss.some(css => css && !css.includes('rtl-'));
        const hasRtl = vendorCss.some(css => css && css.includes('rtl-'));

        if (hasLtr && hasRtl) {
          results.production.passed.push('vendor.css exists with LTR and RTL versions');
          console.log('✅ vendor.css exists with LTR and RTL versions');
          console.log(`   Files: ${vendorCss.join(', ')}`);
        } else {
          results.production.warnings.push(`vendor.css exists but missing LTR or RTL (LTR: ${hasLtr}, RTL: ${hasRtl})`);
          console.log('⚠️  vendor.css exists but may be missing LTR or RTL version');
        }
      } else {
        results.production.failed.push('vendor.css missing from webpack-assets.json');
        console.log('❌ vendor.css missing from webpack-assets.json');
      }

      if (vendor.js) {
        results.production.passed.push('vendor.js exists');
        console.log(`✅ vendor.js exists: ${vendor.js}`);
      }
    } else {
      results.production.failed.push('vendor entry missing from webpack-assets.json');
      console.log('❌ vendor entry missing from webpack-assets.json');
    }

    if (main) {
      if (main.css) {
        const mainCss = Array.isArray(main.css) ? main.css : [main.css];
        results.production.passed.push('main.css exists in webpack-assets.json');
        console.log('✅ main.css exists in webpack-assets.json');
        console.log(`   Files: ${mainCss.join(', ')}`);
      } else {
        results.production.warnings.push('main.css missing from webpack-assets.json (may be acceptable if no CSS in main entry)');
        console.log('⚠️  main.css missing from webpack-assets.json');
        console.log('   (This may be acceptable if no CSS is imported in main entry)');
      }

      if (main.js) {
        results.production.passed.push('main.js exists');
        console.log(`✅ main.js exists: ${main.js}`);
      }
    } else {
      results.production.failed.push('main entry missing from webpack-assets.json');
      console.log('❌ main entry missing from webpack-assets.json');
    }

    if (emptyKey && emptyKey.css) {
      const emptyCss = Array.isArray(emptyKey.css) ? emptyKey.css : [emptyKey.css];
      const nonRtlCss = emptyCss.filter(css => css && !css.includes('rtl-'));

      if (nonRtlCss.length > 0) {
        results.production.warnings.push(`Found ${nonRtlCss.length} CSS file(s) in empty key (should be in vendor/main)`);
        console.log(`⚠️  Found ${nonRtlCss.length} CSS file(s) in empty key:`);
        nonRtlCss.slice(0, 5).forEach(css => console.log(`   - ${css}`));
        if (nonRtlCss.length > 5) {
          console.log(`   ... and ${nonRtlCss.length - 5} more`);
        }
      }
    }

    const distPath = join(__dirname, 'prod', 'dist');
    if (existsSync(distPath)) {
      const cssFiles = readdirSync(distPath)
        .filter(file => file.endsWith('.css') && !file.includes('rtl-'))
        .sort();

      const vendorCssFiles = cssFiles.filter(f => f.startsWith('vendor.'));
      const mainCssFiles = cssFiles.filter(f => f.startsWith('main.'));
      const otherCssFiles = cssFiles.filter(f => !f.startsWith('vendor.') && !f.startsWith('main.'));

      if (vendorCssFiles.length > 0) {
        results.production.passed.push(`vendor.css file exists on disk (${vendorCssFiles.length} file(s))`);
        console.log(`✅ vendor.css file(s) on disk: ${vendorCssFiles.join(', ')}`);
      } else {
        results.production.failed.push('vendor.css file missing from disk');
        console.log('❌ vendor.css file missing from disk');
      }

      if (mainCssFiles.length > 0) {
        results.production.passed.push(`main.css file exists on disk (${mainCssFiles.length} file(s))`);
        console.log(`✅ main.css file(s) on disk: ${mainCssFiles.join(', ')}`);
      } else {
        results.production.warnings.push('main.css file missing from disk (may be acceptable)');
        console.log('⚠️  main.css file missing from disk (may be acceptable)');
      }

      if (otherCssFiles.length > 0) {
        results.production.warnings.push(`Found ${otherCssFiles.length} unexpected CSS file(s) (should be vendor.css or main.css only)`);
        console.log(`⚠️  Found ${otherCssFiles.length} unexpected CSS file(s):`);
        otherCssFiles.slice(0, 10).forEach(file => console.log(`   - ${file}`));
        if (otherCssFiles.length > 10) {
          console.log(`   ... and ${otherCssFiles.length - 10} more`);
        }
      }
    }

  } catch (error) {
    results.production.failed.push(`Error reading webpack-assets.json: ${error.message}`);
    console.log(`❌ Error reading webpack-assets.json: ${error.message}`);
  }
}

function checkHotMode() {
  console.log('\n🔥 Hot Mode Verification:');
  console.log('='.repeat(50));

  const distPath = join(__dirname, 'dist');

  if (!existsSync(distPath)) {
    results.hot.failed.push('dist directory does not exist');
    console.log('❌ dist directory does not exist');
    console.log('   Run "yarn hot" first to generate hot mode build');
    return;
  }

  results.hot.passed.push('dist directory exists');
  console.log('✅ dist directory exists');

  const cssDir = join(distPath, 'CSS');
  const vendorCss = join(cssDir, 'vendor.css');
  const mainCss = join(cssDir, 'main.css');

  if (existsSync(cssDir)) {
    results.hot.passed.push('CSS directory exists');
    console.log('✅ CSS directory exists');
  } else {
    results.hot.failed.push('CSS directory missing');
    console.log('❌ CSS directory missing');
  }

  if (existsSync(vendorCss)) {
    const stats = statSync(vendorCss);
    results.hot.passed.push('CSS/vendor.css exists');
    console.log(`✅ CSS/vendor.css exists (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    results.hot.failed.push('CSS/vendor.css missing');
    console.log('❌ CSS/vendor.css missing');
  }

  if (existsSync(mainCss)) {
    const stats = statSync(mainCss);
    results.hot.passed.push('CSS/main.css exists');
    console.log(`✅ CSS/main.css exists (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    results.hot.failed.push('CSS/main.css missing');
    console.log('❌ CSS/main.css missing');
  }

  const distCssFiles = existsSync(distPath)
    ? readdirSync(distPath).filter(f => f.endsWith('.css') && !f.includes('rtl-'))
    : [];

  const rootCssFiles = distCssFiles.filter(f => !f.startsWith('CSS/'));
  if (rootCssFiles.length > 0) {
    results.hot.warnings.push(`Found ${rootCssFiles.length} CSS file(s) in dist root (should be in CSS/ directory)`);
    console.log(`⚠️  Found ${rootCssFiles.length} CSS file(s) in dist root:`);
    rootCssFiles.slice(0, 5).forEach(file => console.log(`   - ${file}`));
  }
}

function printSummary() {
  console.log('\n📊 Summary:');
  console.log('='.repeat(50));

  const allPassed = [
    ...results.production.passed,
    ...results.hot.passed,
    ...results.general.passed,
  ];
  const allFailed = [
    ...results.production.failed,
    ...results.hot.failed,
    ...results.general.failed,
  ];
  const allWarnings = [
    ...results.production.warnings,
    ...results.hot.warnings,
    ...results.general.warnings,
  ];

  console.log(`✅ Passed: ${allPassed.length}`);
  console.log(`❌ Failed: ${allFailed.length}`);
  console.log(`⚠️  Warnings: ${allWarnings.length}`);

  if (allFailed.length > 0) {
    console.log('\n❌ Failures:');
    allFailed.forEach(failure => console.log(`   - ${failure}`));
  }

  if (allWarnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    allWarnings.forEach(warning => console.log(`   - ${warning}`));
  }

  const success = allFailed.length === 0;
  console.log(`\n${success ? '✅' : '❌'} Overall: ${success ? 'PASS' : 'FAIL'}`);

  return success;
}

console.log('🔍 Webpack Build Verification Script');
console.log('='.repeat(50));

checkProductionBuild();
checkHotMode();

const success = printSummary();

process.exit(success ? 0 : 1);
