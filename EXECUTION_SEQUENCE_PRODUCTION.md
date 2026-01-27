# Production Branch Execution Sequence Analysis

## Overview
This document traces the execution sequence when loading `/en/login` in the production branch, where `componentDidMount` runs correctly.

## Execution Flow

### 1. Server-Side Rendering (entry-server.tsx)

**File**: `app/react/entry-server.tsx`

1. **Route Matching** (line 296)
   - `matchRoutes(routes, req.path)` matches `/en/login` to Login route
   - Route defined in `Routes.tsx` line 89: `<Route path="login" element={<Login />} />`

2. **SSR Rendering** (line 340)
   - `ReactDOMServer.renderToString()` renders the Login component
   - Login component initializes with `state.render = false` (Login.js line 26)
   - Server renders HTML with login form **hidden** (because `this.state.render` is false)

3. **HTML Generation** (Root.js)
   - `Root.js` generates HTML with:
     - SSR content in `<div id="root">`
     - Script tags for webpack assets:
       - `http://localhost:8080/nprogress.js`
       - `http://localhost:8080/main.js` (contains entry-client.tsx)
       - `http://localhost:8080/vendor.js`
   - Window globals injected:
     - `window.UWAZI_ENVIRONMENT`
     - `window.UWAZI_VERSION`
     - `window.__reduxData__`
     - `window.__atomStoreData__`

### 2. Browser Receives HTML

**File**: `app/react/App/Root.js`

The browser receives HTML with:
- Pre-rendered content in `#root` (Login component HTML, but form hidden)
- Script tags pointing to webpack dev server at `localhost:8080`

### 3. Browser Loads Scripts

**Webpack Config**: `webpack/webpack.config.hot.js` (line 29-32)

```javascript
config.entry.main = [
  'webpack-hot-middleware/client?path=//localhost:8080/__webpack_hmr',
  path.join(rootPath, 'app/react/entry-client.tsx'),
];
```

**Key Point**: `entry-client.tsx` is bundled **directly** into `main.js` (no dynamic import)

### 4. entry-client.tsx Executes (Synchronously)

**File**: `app/react/entry-client.tsx`

**Execution Order**:
1. **Imports load** (lines 1-20)
   - React, react-dom/client, Sentry
   - Router components
   - Redux/Jotai providers
   - ErrorBoundary
   - App sockets
   - CustomProvider, atomStore, store, routes

2. **Sentry Init** (lines 22-40)
   - If `window.SENTRY_APP_DSN` exists, initialize Sentry

3. **Router Creation** (line 42)
   - `const router = createBrowserRouter(routes);`
   - Routes include Login at `/login` path

4. **App Component** (lines 44-54)
   - Wraps app in ReduxProvider, CustomProvider, Jotai Provider, ErrorBoundary
   - Contains RouterProvider with the router

5. **Hydration** (line 57)
   - `hydrateRoot(container!, <App />)`
   - React hydrates the pre-rendered HTML in `#root`
   - **This triggers component lifecycle methods**

### 5. React Hydration & Component Lifecycle

**File**: `app/react/Users/Login.js`

1. **Component Hydration**
   - React hydrates the pre-rendered Login component
   - Component state initialized: `render: false` (line 26)

2. **componentDidMount Executes** (line 88-90)
   ```javascript
   componentDidMount() {
     this.setState({ render: true });
   }
   ```
   - **This runs immediately after hydration**
   - Sets `render: true`

3. **Re-render with Form** (line 111)
   - Component re-renders because state changed
   - `{this.state.render && (<LocalForm>...)}` now evaluates to true
   - Login form (username/password fields) appears

## Critical Differences from cjs-esm Branch

### Production (Working)
- ✅ `entry-client.tsx` bundled directly into `main.js`
- ✅ No dynamic imports
- ✅ Script executes synchronously when `main.js` loads
- ✅ React hydration happens immediately
- ✅ `componentDidMount` runs right after hydration

### cjs-esm Branch (Broken - Before Fix)
- ❌ Used `entry-client-bootstrap.ts` with dynamic import
- ❌ Dynamic import required loading separate chunk
- ❌ Chunk loading blocked by CORP headers
- ❌ `entry-client.tsx` never executed
- ❌ No hydration, no `componentDidMount`

## Key Files Reference

1. **Server Entry**: `app/react/entry-server.tsx` - SSR rendering
2. **Client Entry**: `app/react/entry-client.tsx` - Client hydration
3. **Root Component**: `app/react/App/Root.js` - HTML generation
4. **Login Component**: `app/react/Users/Login.js` - Login UI
5. **Routes**: `app/react/Routes.tsx` - Route definitions
6. **Webpack Hot Config**: `webpack/webpack.config.hot.js` - Dev build config

## Verification Points

To verify execution in production:
1. ✅ `main.js` loads with 200 OK
2. ✅ `entry-client.tsx` code executes (check console for any errors)
3. ✅ React hydration completes
4. ✅ `componentDidMount` runs (Login form appears)
5. ✅ No chunk loading errors

## Notes

- The `render: false` initial state prevents form from showing during SSR (security/UX)
- `componentDidMount` ensures form only appears after client-side JS executes
- This pattern prevents form fields from being visible if JS fails to load
