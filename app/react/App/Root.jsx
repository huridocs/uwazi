import { APIURL } from '#app/config.js';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import serialize from 'serialize-javascript';

import { availableLanguages } from '#shared/language/index.js';

const determineHotAssets = query => ({
  JS: [
    'http://localhost:8080/nprogress.js',
    'http://localhost:8080/main.js',
  ],
  CSS: [
    `http://localhost:8080/CSS/main.css${query}`,
  ],
});

const determineAssets = (assets, languageData) => ({
  JS: [assets.nprogress.js, assets.vendor.js, assets.main.js],
  CSS: [assets.vendor.css[languageData.rtl ? 1 : 0], assets.main.css[languageData.rtl ? 1 : 0]],
});

const googelFonts = (
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css?family=Roboto+Mono:100,300,400,500,700|Roboto+Slab:100,300,400,700|Roboto:100,300,400,500,700,900"
  />
);

const getFaviconURL = reduxData => {
  const favicon = reduxData.settings.collection.get('favicon');

  if (!favicon || favicon === '') {
    return '/public/favicon.ico';
  }

  return favicon;
};

const headTag = (head, CSS, reduxData) => (
  <head>
    {head.title.toComponent()}
    {head.meta.toComponent()}
    {head.link.toComponent()}
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    {CSS.map((style, key) => (
      <link key={key} href={style} rel="stylesheet" type="text/css" />
    ))}
    <style
      type="text/css"
      dangerouslySetInnerHTML={{ __html: reduxData.settings.collection.get('customCSS') }}
    />
    {reduxData.settings.collection.get('allowcustomJS') && (
      <script dangerouslySetInnerHTML={{ __html: reduxData.settings.collection.get('customJS') }} />
    )}
    {googelFonts}
    <link rel="shortcut icon" href={getFaviconURL(reduxData)} />
  </head>
);

class Root extends Component {
  renderInitialData() {
    let innerHtml = '';
    if (this.props.reduxData) {
      innerHtml += `window.__reduxData__ = ${serialize(this.props.reduxData, { isJSON: true })};`;
    }
    if (this.props.user) {
      innerHtml += `window.__user__ = ${serialize(this.props.user, { isJSON: true })};`;
    }
    if (this.props.loadingError) {
      innerHtml += `window.__loadingError__ = ${serialize(this.props.loadingError, { isJSON: true })};`;
    }
    if (this.props.atomStoreData) {
      innerHtml += `window.__atomStoreData__ = ${serialize(this.props.atomStoreData, { isJSON: true })};`;
    }
    if (this.props.featureFlags) {
      innerHtml += `window.__featureFlags__ = ${serialize(this.props.featureFlags, { isJSON: true })};`;
    }
    return (
      <script dangerouslySetInnerHTML={{ __html: innerHtml }} /> //eslint-disable-line
    );
  }

  render() {
    const isHotReload = process.env.HOT;
    const { head, language, assets, reduxData, content } = this.props;

    const languageData = availableLanguages.find(l => l.key === language);
    const query = languageData && languageData.rtl ? '?rtl=true' : '';

    const { JS, CSS } = isHotReload
      ? determineHotAssets(query)
      : determineAssets(assets, languageData);

    return (
      <html lang={language} dir={!languageData.rtl ? 'ltr' : 'rtl'} style={{ fontSize: 'unset' }}>
        {headTag(head, CSS, reduxData)}
        <body>
          <div id="root" dangerouslySetInnerHTML={{ __html: content }} />
          <script
            //eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  console.log('🔴 INLINE SCRIPT EXECUTING');
                  window.__inlineScriptTest = true;
                  const testDiv = document.createElement('div');
                  testDiv.id = '__inlineScriptTest';
                  testDiv.style.cssText = 'position:fixed;top:10px;left:10px;background:red;color:white;padding:20px;z-index:999999;font-size:20px;font-family:monospace;';
                  testDiv.textContent = '🔴 INLINE SCRIPT WORKS';
                  document.body.appendChild(testDiv);
                  setTimeout(function() { testDiv.remove(); }, 5000);
                  
                  window.__scriptLoadOrder = [];
                  const originalAppendChild = document.body.appendChild.bind(document.body);
                  document.body.appendChild = function(node) {
                    if (node.tagName === 'SCRIPT' && node.src) {
                      window.__scriptLoadOrder.push(node.src);
                      console.log('Script added to DOM:', node.src);
                      node.addEventListener('load', function() {
                        console.log('✅ Script loaded:', this.src);
                        window.__scriptLoadOrder.push(this.src + ' [LOADED]');
                      });
                      node.addEventListener('error', function() {
                        console.error('❌ Script error:', this.src);
                        window.__scriptLoadOrder.push(this.src + ' [ERROR]');
                      });
                    }
                    return originalAppendChild(node);
                  };
                })();
                window.UWAZI_ENVIRONMENT = "${this.props.environment || process.env.ENVIRONMENT || 'development'}";
                window.UWAZI_VERSION = "${this.props.version || process.env.npm_package_version || 'development'}";
              `,
            }}
          />
          {process.env.SENTRY_APP_DSN && (
            <script
              //eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: `window.SENTRY_APP_DSN = "${process.env.SENTRY_APP_DSN}"`,
              }}
            />
          )}
          {this.renderInitialData()}
          {head.script.toComponent()}
          {JS.map((file, index) => (
            <script
              key={index}
              src={file}
              crossOrigin="anonymous"
              onLoad={() => {
                if (file.includes('main.js')) {
                  console.log('✅ main.js loaded');
                  window.__mainJsLoaded = true;
                  setTimeout(() => {
                    if (!window.__entryClientExecuting) {
                      console.error('❌ entry-client did not execute');
                    } else {
                      console.log('✅ entry-client executed successfully!');
                    }
                  }, 2000);
                }
              }}
            />
          ))}
          <script
            //eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: `
                window.addEventListener('error', function(e) {
                  console.error('Global error:', e.message, e.filename, e.lineno);
                  const errDiv = document.createElement('div');
                  errDiv.style.cssText = 'position:fixed;bottom:10px;left:10px;background:red;color:white;padding:20px;z-index:999999;font-size:16px;max-width:500px;';
                  errDiv.textContent = 'ERROR: ' + e.message + ' at ' + e.filename + ':' + e.lineno;
                  document.body.appendChild(errDiv);
                });
                window.addEventListener('unhandledrejection', function(e) {
                  console.error('Unhandled promise rejection:', e.reason);
                  const errDiv = document.createElement('div');
                  errDiv.style.cssText = 'position:fixed;bottom:10px;left:10px;background:orange;color:white;padding:20px;z-index:999999;font-size:16px;max-width:500px;';
                  errDiv.textContent = 'PROMISE REJECTION: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason));
                  document.body.appendChild(errDiv);
                });
                setTimeout(function() {
                  console.log('=== DEBUGGING WEBPACK CHUNK LOADING (3s check) ===');
                  console.log('window.__entryClientExecuting:', window.__entryClientExecuting);
                  console.log('window.__mainJsLoaded:', window.__mainJsLoaded);
                  
                  try {
                    if (typeof self !== 'undefined') {
                      console.log('self.webpackChunkuwazi:', self.webpackChunkuwazi);
                      console.log('webpackChunkuwazi length:', self.webpackChunkuwazi && self.webpackChunkuwazi.length);
                      if (self.webpackChunkuwazi && self.webpackChunkuwazi.length > 0) {
                        console.log('First chunk in array:', self.webpackChunkuwazi[0]);
                      }
                    }
                  } catch(e) {
                    console.error('Error checking webpackChunkuwazi:', e);
                  }
                  
                  const allScripts = Array.from(document.querySelectorAll('script[src]'));
                  console.log('All script elements:', allScripts.map(s => ({ src: s.src, complete: s.complete, readyState: s.readyState })));
                  
                  const vendorScript = allScripts.find(s => s.src.includes('vendor.js'));
                  const mainScript = allScripts.find(s => s.src.includes('main.js'));
                  console.log('vendor.js found:', !!vendorScript, 'complete:', vendorScript && vendorScript.complete);
                  console.log('main.js found:', !!mainScript, 'complete:', mainScript && mainScript.complete);
                  
                  if (mainScript && !mainScript.complete) {
                    console.warn('⚠️ main.js script element exists but not complete');
                    mainScript.addEventListener('load', () => {
                      console.log('✅ main.js onLoad fired (late)');
                      window.__mainJsLoaded = true;
                    });
                  }
                  
                  if (self.webpackChunkuwazi && self.webpackChunkuwazi.length >= 2) {
                    console.log('✅ Vendor chunk registered in webpackChunkuwazi');
                    console.log('Full array:', JSON.stringify(self.webpackChunkuwazi.map(c => c[0]), null, 2));
                    
                    const vendorChunk = self.webpackChunkuwazi.find(chunk => {
                      const chunkName = Array.isArray(chunk[0]) ? chunk[0][0] : chunk[0];
                      return chunkName === 'vendor';
                    });
                    
                    if (vendorChunk) {
                      console.log('✅ Found vendor chunk:', vendorChunk[0]);
                      console.log('Vendor chunk data:', vendorChunk[1] ? 'exists' : 'missing');
                    } else {
                      console.error('❌ Vendor chunk not found');
                      console.log('Chunk names found:', self.webpackChunkuwazi.map(c => {
                        const name = Array.isArray(c[0]) ? c[0] : [c[0]];
                        return name;
                      }));
                    }
                    
                    if (!window.__entryClientExecuting) {
                      console.error('⚠️ CRITICAL: Vendor in array but entry-client not executing');
                      console.error('Webpack chunk callback is not firing');
                      console.error('Attempting to manually inspect webpack runtime...');
                      
                      try {
                        const mainScript = document.querySelector('script[src*="main.js"]');
                        if (mainScript && mainScript.textContent) {
                          console.log('main.js has inline content, checking for __webpack_require__...');
                        }
                        
                        if (typeof window.__webpack_require__ !== 'undefined') {
                          console.log('window.__webpack_require__ exists globally');
                        } else {
                          console.log('window.__webpack_require__ does not exist (expected - it is scoped)');
                        }
                      } catch(e) {
                        console.error('Error inspecting webpack runtime:', e);
                      }
                      
                      const errorDiv = document.createElement('div');
                      errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:red;color:white;padding:30px;z-index:999999;font-size:16px;max-width:800px;';
                      errorDiv.innerHTML = '❌ CRITICAL: Vendor loaded but entry-client not executing<br>Webpack chunk callback not firing<br>See console for details';
                      document.body.appendChild(errorDiv);
                    }
                  } else {
                    console.error('❌ webpackChunkuwazi array missing or has < 2 items');
                    console.log('Array:', self.webpackChunkuwazi);
                  }
                  
                  if (!window.__entryClientExecuting && vendorScript && vendorScript.complete && mainScript && mainScript.complete) {
                    console.error('❌ Both scripts loaded but entry-client not executing');
                    console.error('This suggests __webpack_require__.O callback is not firing');
                    const warnDiv = document.createElement('div');
                    warnDiv.style.cssText = 'position:fixed;bottom:10px;right:10px;background:red;color:white;padding:20px;z-index:999999;font-size:16px;max-width:500px;';
                    warnDiv.innerHTML = '❌ Both scripts loaded but entry-client not executing<br>Webpack chunk callback may not be firing';
                    document.body.appendChild(warnDiv);
                  }
                }, 3000);
              `,
            }}
          />
        </body>
      </html>
    );
  }
}

Root.propTypes = {
  user: PropTypes.object,
  children: PropTypes.object,
  reduxData: PropTypes.object,
  head: PropTypes.object,
  content: PropTypes.string,
  language: PropTypes.string,
  assets: PropTypes.object,
  loadingError: PropTypes.object,
  atomStoreData: PropTypes.object,
  featureFlags: PropTypes.object,
  environment: PropTypes.string,
  version: PropTypes.string,
};

export { headTag };
export default Root;
