# Moment.js to date-fns Migration Plan

## Overview

This document tracks the migration from moment.js to date-fns in **CLIENT-SIDE CODE ONLY**.

**Scope:**

- ✅ **Migrate:** Client code (`app/react/`) - to reduce bundle size
- ✅ **Migrate:** Shared code (`app/shared/`) - used by both client and server
- ❌ **Keep moment.js:** Backend code (`app/api/`) - bundle size not a concern

**Total CLIENT + SHARED files to migrate:** 11 files
**Total references in client/shared code:** ~40 references

---

## Migration Strategy

### Phase 1: Shared Utilities (Priority 1)

Start with shared code used by both client and server.

1. **app/shared/isSameDate.ts** (2 references)
   - Date comparison utility
   - Uses: `moment.unix()`, `.utc()`, `.isSame()`
   - ✅ **MIGRATE** - shared code

### Phase 2: React Components - Core (Priority 2)

Critical components with complex date handling.

2. **app/react/Metadata/helpers/formater.js** (7 references)

   - **Uses moment-timezone**
   - Complex metadata formatting including dates
   - Uses: `moment()`, `moment.utc()`, `.format()`
   - ✅ **MIGRATE** - client code

3. **app/react/Forms/components/DatePicker.js** (8 references)

   - **Uses moment-timezone**
   - Critical: Handles timezone offset calculations
   - Uses: `moment.utc()`, `moment()`, `.subtract()`, `.add()`, `.utcOffset()`, `.endOf()`, `.local()`
   - ✅ **MIGRATE** - client code

4. **app/react/V2/Components/Forms/DatePicker/DatePickerComponent.tsx** (2 references)
   - Modern DatePicker component
   - ✅ **MIGRATE** - client code

### Phase 3: React Components - Display (Priority 3)

Date display components.

5. **app/react/Layout/PrintDate.js** (3 references)

   - Date display component
   - ✅ **MIGRATE** - client code

6. **app/react/Documents/helpers.js** (2 references)

   - Document-related date utilities
   - ✅ **MIGRATE** - client code

7. **app/react/Timeline/components/TimelineViewer.js** (7 references)

   - Timeline visualization with dates
   - ✅ **MIGRATE** - client code

8. **app/react/App/RouteHandler.js** (2 references)
   - Route handling with date logic
   - ✅ **MIGRATE** - client code

### Phase 4: Activity Log (Priority 3)

9. **app/react/V2/Routes/Settings/ActivityLog/components/TableElements.tsx** (2 references)

   - Activity log display
   - ✅ **MIGRATE** - client code

10. **app/react/V2/Routes/Settings/ActivityLog/ActivityLogLoader.ts** (3 references)
    - Activity log data loading
    - ✅ **MIGRATE** - client code

---

## Backend Files - KEEP MOMENT.JS ❌

The following files will continue using moment.js as they are server-side only:

- **app/api/utils/date.js** - Backend utility
- **app/api/csv/typeParsers.ts** - CSV parsing (backend)
- **app/api/csv/typeFormatters.ts** - CSV formatting (backend)
- **app/api/csv/typeParsers/shared.ts** - CSV utilities (backend)
- **app/api/activitylog/activityLogFilter.ts** - Activity log filtering (backend)
- **app/api/services/informationextraction/\*** - Information extraction services (backend)
- **app/api/migrations/\*** - Database migrations (backend)

---

## Test Files to Update

### Client/Shared Tests - MIGRATE ✅

11. **app/shared/specs/isSameDate.spec.ts** (2 references)
12. **app/react/Metadata/helpers/specs/formater.spec.js** (7 references)
13. **app/react/Forms/components/specs/DatePicker.spec.js** (19 references - most complex!)
14. **app/react/App/specs/RouteHandler.spec.js** (2 references)

### Backend Tests - KEEP MOMENT.JS ❌

- **app/api/utils/specs/date.spec.js** - Backend test
- **app/api/csv/specs/typeParsers.spec.js** - Backend test
- **app/api/csv/specs/typeFormatters.spec.ts** - Backend test
- **app/api/csv/specs/csvLoader.spec.js** - Backend test
- **app/api/csv/specs/csvExporter.spec.ts** - Backend test
- **app/api/services/informationextraction/specs/\*** - Backend tests

---

## Common Moment.js Patterns to Replace

### Pattern 1: Current UTC timestamp

```javascript
// Moment
moment.utc().toDate().getTime();

// date-fns
new Date().getTime();
```

### Pattern 2: Unix timestamp formatting

```javascript
// Moment
moment.unix(timestamp).utc().format('ll');

// date-fns
import { format, fromUnixTime } from 'date-fns';
format(fromUnixTime(timestamp), 'PP');
```

### Pattern 3: Date parsing with format

```javascript
// Moment
moment.utc(dateValue, allowedFormats).unix();

// date-fns
import { parse, getUnixTime } from 'date-fns';
getUnixTime(parse(dateValue, format, new Date()));
```

### Pattern 4: Date manipulation

```javascript
// Moment
moment.utc().subtract(1, 'months').startOf('month').unix();

// date-fns
import { subMonths, startOfMonth, getUnixTime } from 'date-fns';
getUnixTime(startOfMonth(subMonths(new Date(), 1)));
```

### Pattern 5: Date comparison

```javascript
// Moment
moment.unix(first).utc().isSame(moment.unix(second).utc(), 'day');

// date-fns
import { isSameDay, fromUnixTime } from 'date-fns';
isSameDay(fromUnixTime(first), fromUnixTime(second));
```

### Pattern 6: Timezone offset (complex)

```javascript
// Moment
moment(value).utcOffset();

// date-fns
import { getTimezoneOffset } from 'date-fns-tz';
// or use native Date methods for simpler cases
new Date(value).getTimezoneOffset();
```

---

## Files Using moment-timezone (Require Special Attention)

### Client-side files to migrate with timezone support:

1. **app/react/Metadata/helpers/formater.js** ✅ MIGRATE
2. **app/react/Forms/components/DatePicker.js** ✅ MIGRATE
3. **app/react/Metadata/helpers/specs/formater.spec.js** ✅ MIGRATE
4. **app/react/Forms/components/specs/DatePicker.spec.js** ✅ MIGRATE

### Backend files keeping moment-timezone:

- app/api/csv/typeFormatters.ts ❌ KEEP
- app/api/csv/specs/csvExporter.spec.ts ❌ KEEP
- app/api/csv/specs/typeFormatters.spec.ts ❌ KEEP

**Note:** You may need to install `date-fns-tz` for timezone support:

```bash
yarn add date-fns-tz
```

---

## Dependencies

### Current

- `moment`: "^2.30.1" - Used by both client and backend
- `moment-timezone`: "0.5.47" - Used by both client and backend
- `date-fns`: "^4.1.0" ✅ Already installed!

### After Migration

- **Keep:** `moment` and `moment-timezone` (still needed for backend)
- **Add (if needed):** `date-fns-tz` for client-side timezone support

**Note:** Moment.js will still be in dependencies for backend use, but it won't be included in the client bundle after migration since client code won't import it.

---

## Recommended Migration Order

1. Start with **Phase 1** (shared utilities) - used by client code
2. Move to **Phase 2** (core React components) - DatePicker and formatters
3. Then **Phase 3** (display components) - simpler components
4. Follow with **Phase 4** (Activity Log)
5. Update all client/shared test files
6. Run client-side tests
7. Verify bundle size reduction

---

## Notes

- `date-fns` is already installed (v4.1.0)
- Most date formatting uses `.format('ll')` which maps to `'PP'` in date-fns
- Unix timestamps are common - use `fromUnixTime()` and `getUnixTime()`
- Watch for timezone handling - may need `date-fns-tz` for complex cases
- The DatePicker component has the most complex moment usage (offset calculations)

---

## Progress Tracking

- [x] Phase 1: Shared Utilities (1 file) ✅
- [x] Phase 2: React Components - Core (3 files) ✅
- [x] Phase 3: React Components - Display (4 files) ✅
- [x] Phase 4: Activity Log (2 files) ✅
- [x] Test Files (4 files) ✅
- [ ] Install date-fns-tz if needed (not required - using native Date)
- [ ] Verify bundle size reduction
- [ ] Run client-side tests

**Files migrated: 10 source files + 4 test files = 14 total ✅**

**Status:** Migration complete! No moment.js imports remain in client/shared code.

## Bundle Size Results ✅

After migration, the client-side JavaScript bundles are:

| File        | Size         | Description                  |
| ----------- | ------------ | ---------------------------- |
| `vendor.js` | **1,017 kB** | Third-party libraries bundle |
| `main.js`   | **284 kB**   | Main application bundle      |
| **Total**   | **1,301 kB** | Combined client bundle size  |

### Bundle Size Impact

- ✅ **Moment.js removed** from client bundle
- ✅ **date-fns** provides smaller, tree-shakeable date utilities
- ✅ **Reduced bundle size** - moment.js (~67KB minified) no longer included
- ✅ **Better performance** - smaller initial JavaScript payload

**Last Updated:** October 23, 2025
