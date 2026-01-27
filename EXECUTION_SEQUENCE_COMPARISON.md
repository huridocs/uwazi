# Execution Sequence Comparison: Production vs cjs-esm

## Current Status

**Branch**: `cjs-esm`
**Issue**: Breakpoints in browser debugger not stopping at client code
**Observation**: `componentDidMount` runs correctly in production branch

## Webpack Configuration Comparison

### Production Branch
```javascript
// webpack/webpack.config.hot.js
config.entry.main = [
  'webpack-hot-middleware/client?path=//localhost:8080/__webpack_hmr',
  path.join(rootPath, 'app/react/entry-client.tsx'),
];
```

### cjs-esm Branch (Current)
```javascript
// webpack/webpack.config.hot.cjs
config.entry.main = [
  'webpack-hot-middleware/client?path=//localhost:8080/__webpack_hmr',
  path.join(rootPath, 'app/react/entry-client.tsx'),
];
```

✅ **Both branches use the same entry point configuration**

## Source Map Configuration

**File**: `webpack/config.cjs` (line 31)
```javascript
devtool: 'eval-source-map',
```

✅ **Source maps are enabled**

## Why Breakpoints Might Not Work

### 1. **Source Map Loading Timing**
- Webpack generates source maps separately from bundles
- Browser must load both the bundle AND the source map
- If source maps load after code executes, breakpoints won't hit

### 2. **eval-source-map Behavior**
- `eval-source-map` embeds source maps in the bundle using `eval()`
- Each module is wrapped in `eval()` with source map data
- Browser devtools need to parse these inline source maps
- Sometimes devtools cache old source maps

### 3. **Code Execution Before Debugger Attaches**
- If code executes immediately when `main.js` loads
- Breakpoints set after page load won't catch initial execution
- Need to set breakpoints BEFORE the script loads

### 4. **Webpack HMR Interference**
- Hot Module Replacement can invalidate source maps
- Devtools might lose breakpoint mappings during HMR updates

## Debugging Strategy

### Option 1: Use `debugger;` Statements
Add explicit `debugger;` statements in code:

```typescript
// app/react/entry-client.tsx
const router = createBrowserRouter(routes);
debugger; // Browser will pause here if devtools are open

const App = () => (
  // ...
);

const container = document.getElementById('root');
debugger; // Pause before hydration
const root = window.__loadingError__ === undefined 
  ? hydrateRoot(container!, <App />) 
  : container;
```

### Option 2: Use Console Logs with Stack Traces
```typescript
console.trace('entry-client executing');
console.log('Router created:', router);
console.log('About to hydrate');
```

### Option 3: Check Source Maps in Network Tab
1. Open DevTools → Network tab
2. Filter by "JS" or "Source Map"
3. Look for `main.js.map` or inline source maps
4. Verify they load with 200 status

### Option 4: Use Chrome DevTools Settings
1. DevTools → Settings (⚙️)
2. Sources → Enable:
   - ✅ "Enable JavaScript source maps"
   - ✅ "Detect indentation"
3. Reload page

### Option 5: Verify Execution with Performance API
```javascript
// In browser console
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('main.js'))
  .forEach(r => {
    console.log('Resource:', r.name);
    console.log('Status:', r.responseStatus);
    console.log('Size:', r.transferSize);
  });
```

## Execution Flow Verification

### Production Branch (Working)
1. ✅ Server renders HTML with SSR content
2. ✅ Browser loads `main.js` (200 OK)
3. ✅ `entry-client.tsx` executes synchronously
4. ✅ React hydrates immediately
5. ✅ `componentDidMount` runs
6. ✅ Login form appears

### cjs-esm Branch (Current)
1. ✅ Server renders HTML with SSR content
2. ✅ Browser loads `main.js` (200 OK)
3. ❓ `entry-client.tsx` execution status unknown
4. ❓ React hydration status unknown
5. ❓ `componentDidMount` execution status unknown
6. ❓ Login form visibility unknown

## Diagnostic Commands

### Check if entry-client executes:
```javascript
// In browser console
window.__entryClientExecuted = true;
// Then check if it's set after page load
```

### Check React hydration:
```javascript
// In browser console
const root = document.getElementById('root');
console.log('Root innerHTML length:', root?.innerHTML?.length);
console.log('Root has React fiber?', root?._reactRootContainer);
```

### Check componentDidMount:
```javascript
// Add to Login.js componentDidMount:
componentDidMount() {
  console.log('Login componentDidMount executed');
  debugger; // Force breakpoint
  this.setState({ render: true });
}
```

## Recommended Next Steps

1. **Add explicit `debugger;` statements** to verify execution
2. **Check Network tab** for source map loading
3. **Verify source maps are enabled** in DevTools settings
4. **Use console.log** to trace execution flow
5. **Compare Network tab** between production and cjs-esm branches

## Key Insight

If `componentDidMount` runs in production but not in cjs-esm, the issue is likely:
- **Code not executing** (chunk loading blocked)
- **Code executing but hydration failing** (React error)
- **Code executing but lifecycle not triggering** (component not mounting)

The breakpoint issue is secondary - first verify the code is actually executing.
