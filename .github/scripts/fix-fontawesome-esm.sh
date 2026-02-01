#!/bin/bash
set -e

echo "🔧 Fixing packages for ESM compatibility..."
echo "  Working directory: $(pwd)"
echo "  Node modules exists: $([ -d node_modules ] && echo 'yes' || echo 'no')"

# Add exports to free-solid-svg-icons if missing
SOLID_PATH="node_modules/@fortawesome/free-solid-svg-icons/package.json"
if [ -f "$SOLID_PATH" ]; then
	echo "  Checking @fortawesome/free-solid-svg-icons..."
	if ! grep -q '"exports"' "$SOLID_PATH"; then
		echo "    Adding exports to @fortawesome/free-solid-svg-icons"
		node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$SOLID_PATH'));
      pkg.exports = {
        '.': { types: './index.d.ts', import: './index.js', require: './index.js', default: './index.js' },
        './*': './*.js'
      };
      fs.writeFileSync('$SOLID_PATH', JSON.stringify(pkg, null, 2));
    "
	else
		echo "    Already has exports, skipping"
	fi
else
	echo "  WARNING: $SOLID_PATH not found"
fi

# Add exports to free-regular-svg-icons if missing
REGULAR_PATH="node_modules/@fortawesome/free-regular-svg-icons/package.json"
if [ -f "$REGULAR_PATH" ]; then
	echo "  Checking @fortawesome/free-regular-svg-icons..."
	if ! grep -q '"exports"' "$REGULAR_PATH"; then
		echo "    Adding exports to @fortawesome/free-regular-svg-icons"
		node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$REGULAR_PATH'));
      pkg.exports = {
        '.': { types: './index.d.ts', import: './index.js', require: './index.js', default: './index.js' },
        './*': './*.js'
      };
      fs.writeFileSync('$REGULAR_PATH', JSON.stringify(pkg, null, 2));
    "
	else
		echo "    Already has exports, skipping"
	fi
else
	echo "  WARNING: $REGULAR_PATH not found"
fi

# Fix react-dropzone imports for ESM
DROPZONE_PATH="node_modules/react-dropzone/dist/es/index.js"
if [ -f "$DROPZONE_PATH" ]; then
	echo "  Checking react-dropzone..."
	# Check for either pattern
	if grep -q "from './utils'" "$DROPZONE_PATH" 2>/dev/null || grep -q "from './utils/index'" "$DROPZONE_PATH" 2>/dev/null; then
		echo "    Fixing react-dropzone imports"
		sed -i "s|from './utils/index'|from './utils/index.js'|g" "$DROPZONE_PATH"
		sed -i "s|from './utils'|from './utils/index.js'|g" "$DROPZONE_PATH"
	else
		echo "    Imports already fixed or using different pattern, skipping"
	fi
else
	echo "  WARNING: $DROPZONE_PATH not found"
fi

echo ""
echo "🔍 Verifying fixes..."
if [ -f "$SOLID_PATH" ]; then
	if grep -q '"exports"' "$SOLID_PATH"; then
		echo "  ✅ @fortawesome/free-solid-svg-icons has exports"
	else
		echo "  ❌ @fortawesome/free-solid-svg-icons MISSING exports!"
		exit 1
	fi
fi

if [ -f "$REGULAR_PATH" ]; then
	if grep -q '"exports"' "$REGULAR_PATH"; then
		echo "  ✅ @fortawesome/free-regular-svg-icons has exports"
	else
		echo "  ❌ @fortawesome/free-regular-svg-icons MISSING exports!"
		exit 1
	fi
fi

if [ -f "$DROPZONE_PATH" ]; then
	if grep -q "from './utils'" "$DROPZONE_PATH" 2>/dev/null; then
		echo "  ❌ react-dropzone still has unfixed imports!"
		exit 1
	else
		echo "  ✅ react-dropzone imports are fixed"
	fi
fi

echo ""
echo "✅ ESM compatibility fixes complete and verified"
