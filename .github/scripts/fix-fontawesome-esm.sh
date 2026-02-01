#!/bin/bash
set -e

echo "🔧 Fixing packages for ESM compatibility..."

# Add exports to free-solid-svg-icons if missing
SOLID_PATH="node_modules/@fortawesome/free-solid-svg-icons/package.json"
if [ -f "$SOLID_PATH" ]; then
	if ! grep -q '"exports"' "$SOLID_PATH"; then
		echo "  Adding exports to @fortawesome/free-solid-svg-icons"
		node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$SOLID_PATH'));
      pkg.exports = {
        '.': { types: './index.d.ts', import: './index.js', require: './index.js', default: './index.js' },
        './*': './*.js'
      };
      fs.writeFileSync('$SOLID_PATH', JSON.stringify(pkg, null, 2));
    "
	fi
fi

# Add exports to free-regular-svg-icons if missing
REGULAR_PATH="node_modules/@fortawesome/free-regular-svg-icons/package.json"
if [ -f "$REGULAR_PATH" ]; then
	if ! grep -q '"exports"' "$REGULAR_PATH"; then
		echo "  Adding exports to @fortawesome/free-regular-svg-icons"
		node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$REGULAR_PATH'));
      pkg.exports = {
        '.': { types: './index.d.ts', import: './index.js', require: './index.js', default: './index.js' },
        './*': './*.js'
      };
      fs.writeFileSync('$REGULAR_PATH', JSON.stringify(pkg, null, 2));
    "
	fi
fi

# Fix react-dropzone imports for ESM
DROPZONE_PATH="node_modules/react-dropzone/dist/es/index.js"
if [ -f "$DROPZONE_PATH" ]; then
	if grep -q "from './utils'" "$DROPZONE_PATH" || grep -q 'from "./utils/index"' "$DROPZONE_PATH"; then
		echo "  Fixing react-dropzone imports"
		sed -i "s|from ['\"]\.\/utils\/index['\"]|from './utils/index.js'|g; s|from ['\"]\.\/utils['\"]|from './utils/index.js'|g" "$DROPZONE_PATH"
	fi
fi

echo "✅ ESM compatibility fixes complete"
