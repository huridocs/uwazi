#!/bin/bash

# Script to resolve merge conflicts by prioritizing ESM patterns (#app/#api/#shared) over relative imports

CONFLICTED_FILES=$(git diff --name-only --diff-filter=U)

for file in $CONFLICTED_FILES; do
  if [[ "$file" == *.ts ]] || [[ "$file" == *.tsx ]] || [[ "$file" == *.js ]]; then
    echo "Processing $file..."
    
    # Check if file has import conflicts
    if grep -q "^import.*from" "$file" 2>/dev/null; then
      # Use a temporary file to process
      temp_file=$(mktemp)
      
      # Strategy: Keep lines with #app/#api/#shared imports, prefer production for others
      # This is a simplified approach - manual review may be needed
      awk '
        /^<<<<<<< HEAD/ { in_conflict=1; head_lines=""; production_lines=""; next }
        /^=======/ { in_head=0; in_production=1; next }
        /^>>>>>>> production/ { 
          in_conflict=0; 
          # Check if head has ESM pattern
          if (head_lines ~ /#(app|api|shared|UI|V2)\//) {
            print head_lines;
          } else if (production_lines ~ /#(app|api|shared|UI|V2)\//) {
            print production_lines;
          } else {
            # If neither has ESM, prefer production
            print production_lines;
          }
          head_lines=""; production_lines=""; next
        }
        in_conflict && in_head { head_lines = head_lines $0 "\n"; next }
        in_conflict && in_production { production_lines = production_lines $0 "\n"; next }
        { print }
      ' "$file" > "$temp_file"
      
      # Only replace if we made changes
      if ! diff -q "$file" "$temp_file" > /dev/null 2>&1; then
        mv "$temp_file" "$file"
        echo "  Resolved conflicts in $file"
      else
        rm "$temp_file"
      fi
    fi
  fi
done

echo "Done processing import conflicts. Manual review may be needed for complex cases."
