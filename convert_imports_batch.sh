#!/bin/bash

# Convert app/ and shared/ imports to ESM patterns

find app -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" \) ! -path "*/specs/*" ! -path "*/node_modules/*" | while read file; do
  # Convert app/ imports to #app/
  sed -i "s|from 'app/|from '#app/|g" "$file"
  sed -i 's|from "app/|from "#app/|g' "$file"
  
  # Convert shared/ imports to #shared/
  sed -i "s|from 'shared/|from '#shared/|g" "$file"
  sed -i 's|from "shared/|from "#shared/|g' "$file"
  
  # Add .js extension if missing (for #app and #shared imports)
  sed -i "s|from '#app/\([^']*\)'|from '#app/\1.js'|g" "$file"
  sed -i 's|from "#app/\([^"]*\)"|from "#app/\1.js"|g' "$file"
  sed -i "s|from '#shared/\([^']*\)'|from '#shared/\1.js'|g" "$file"
  sed -i 's|from "#shared/\([^"]*\)"|from "#shared/\1.js"|g' "$file"
  
  # Remove duplicate .js extensions
  sed -i 's|\.js\.js|.js|g' "$file"
done

echo "Conversion complete"
