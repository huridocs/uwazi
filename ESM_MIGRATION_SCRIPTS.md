# ESM Migration Scripts - Consolidated Solution

## Overview

This document describes the consolidated ESM import fixing solution that replaces the many individual scripts with one efficient, comprehensive tool.

## Main Script

### `scripts/fix-esm-imports-unified.mjs`

**Purpose**: Comprehensive script that fixes all ESM import issues in one pass.

**Features**:
- Automatically resolves broken import paths
- Converts `.ts`/`.tsx` to `.js`/`.jsx` extensions (ESM requirement)
- Handles import map paths (`#api`, `#shared`, `#app`, etc.)
- Fixes relative imports
- Validates file existence before making changes
- Uses known path mappings for common broken imports

**Usage**:
```bash
node scripts/fix-esm-imports-unified.mjs
```

**Or use the wrapper**:
```bash
node scripts/fix-esm-imports.mjs
```

## What It Fixes

1. **Path Mappings**: Automatically fixes known broken paths:
   - `#api/common.v2/database/*` → `#api/core/infrastructure/mongodb/common/*`
   - `#api/templates.v2/model/*` → `#api/core/domain/template/*`
   - `#api/eventsbus` → `#api/core/libs/eventsbus`
   - And many more...

2. **Extension Conversion**: Converts TypeScript extensions to JavaScript in imports:
   - `.ts` → `.js`
   - `.tsx` → `.jsx`

3. **Relative Imports to Import Maps**: Converts relative imports (`../`, `../../`) to import map paths (`#api/`, `#shared/`, `#app/`) when:
   - The import crosses package boundaries (api ↔ shared ↔ react)
   - The target file is within the project structure
   - This makes imports more maintainable and ESM-compliant

4. **Broken Relative Imports**: Fixes broken relative imports by finding actual file locations

5. **Import Map Resolution**: Ensures all imports use correct import map paths

## Known Path Mappings

The script includes mappings for commonly broken imports. Current mappings include:

- `#api/common.v2/database/*` → `#api/core/infrastructure/mongodb/common/*`
- `#api/templates.v2/model/*` → `#api/core/domain/template/*`
- `#api/templates.v2/database/*` → `#api/core/infrastructure/mongodb/template/*`
- `#api/queue.v2/*` → `#api/core/libs/queue/*`
- `#api/eventsbus` → `#api/core/libs/eventsbus`
- `#api/files.v2/model/*` → `#api/core/domain/files/*`
- Relative imports for `../model/*`, `../templates/events/*`, `../queue.v2/*`, etc.

To add new mappings, edit the `knownPathMappings` object in `fix-esm-imports-unified.mjs`.

## Replaced Scripts

The unified script replaces these individual scripts:
- `fix-broken-imports.mjs`
- `fix-all-broken-imports.mjs`
- `fix-import-paths.mjs`
- `fix-import-extensions.mjs`
- `fix-ts-extensions-to-js.mjs`
- `fix-absolute-imports.mjs`
- And many others...

## Workflow

1. Run the unified script:
   ```bash
   node scripts/fix-esm-imports-unified.mjs
   ```

2. Check for errors:
   ```bash
   yarn hot
   ```

3. If new errors appear, add them to `knownPathMappings` and re-run

4. Verify TypeScript:
   ```bash
   yarn check-types
   ```

## Performance

- Processes all files in one pass
- Only modifies files that need changes
- Validates file existence before making changes
- Much faster than running multiple scripts sequentially

## Maintenance

When new broken imports are discovered:
1. Identify the correct path
2. Add to `knownPathMappings` in `fix-esm-imports-unified.mjs`
3. Re-run the script
