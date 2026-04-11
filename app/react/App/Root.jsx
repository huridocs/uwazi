import PropTypes from 'prop-types';
import React, { Component } from 'react';
import serialize from 'serialize-javascript';

import { availableLanguages } from '#shared/language/index.js';
import { getThemeAsset } from '#V2/theme/themes.js';

const determineHotAssets = query => ({
  JS: [
    'http://localhost:8080/nprogress.js',
    'http://localhost:8080/main.js',
    'http://localhost:8080/vendor.js',
  ],
  CSS: [
    `http://localhost:8080/CSS/vendor.css${query}`,
    `http://localhost:8080/CSS/main.css${query}`,
  ],
});

const determineAssets = (assets, languageData) => {
  if (!assets) {
    return { JS: [], CSS: [] };
  }
  const rtlIndex = languageData?.rtl ? 1 : 0;
  const vendorCss = assets.vendor?.css;
  const mainCss = assets.main?.css;
  const cssArray = [];
  if (vendorCss) {
    if (Array.isArray(vendorCss)) {
      cssArray.push(vendorCss[rtlIndex] || vendorCss[0]);
    } else {
      cssArray.push(vendorCss);
    }
  }
  if (mainCss) {
    if (Array.isArray(mainCss)) {
      cssArray.push(mainCss[rtlIndex] || mainCss[0]);
    } else {
      cssArray.push(mainCss);
    }
  }

  return {
    JS: [assets.nprogress?.js, assets.vendor?.js, assets.main?.js].filter(Boolean),
    CSS: cssArray.filter(Boolean),
  };
};

const googelFonts = (
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css?family=Roboto+Mono:100,300,400,500,700|Roboto+Slab:100,300,400,700|Roboto:100,300,400,500,700,900"
  />
);

const getFaviconURL = reduxData => {
  const favicon = reduxData.settings.collection.get('favicon');
  const themeAssets = reduxData.settings.collection.get('themeAssets');
  const themeVars = reduxData.settings.collection.get('themeVars');
  const themeCustomization = reduxData.settings.collection.get('themeCustomization');
  return getThemeAsset(
    themeAssets,
    themeVars,
    'light',
    'favicon',
    favicon || '',
    Boolean(themeCustomization)
  );
};

const getFaviconLinks = reduxData => {
  const favicon = reduxData.settings.collection.get('favicon');
  const themeAssets = reduxData.settings.collection.get('themeAssets');
  const themeVars = reduxData.settings.collection.get('themeVars');
  const themeCustomization = reduxData.settings.collection.get('themeCustomization');

  if (!themeCustomization) {
    return [<link key="favicon-default" rel="shortcut icon" href={getFaviconURL(reduxData)} />];
  }

  const lightFavicon = getThemeAsset(
    themeAssets,
    themeVars,
    'light',
    'favicon',
    favicon || '',
    Boolean(themeCustomization)
  );
  const darkFavicon = getThemeAsset(
    themeAssets,
    themeVars,
    'dark',
    'favicon',
    favicon || '',
    Boolean(themeCustomization)
  );

  return [
    <link
      key="favicon-light"
      rel="icon"
      href={lightFavicon}
      media="(prefers-color-scheme: light)"
    />,
    <link
      key="favicon-dark"
      rel="icon"
      href={darkFavicon}
      media="(prefers-color-scheme: dark)"
    />,
    <link key="favicon-shortcut" rel="shortcut icon" href={getFaviconURL(reduxData)} />,
  ];
};

const safeHelmet = result => {
  if (Array.isArray(result)) return result;
  if (result != null && typeof result === 'object' && result.$$typeof) return result;
  if (result != null && typeof result === 'object' && !Array.isArray(result)) return null;
  return result;
};

const headTag = (head, CSS, reduxData) => (
  <head>
    {safeHelmet(head.title?.toComponent?.())}
    {safeHelmet(head.meta?.toComponent?.())}
    {safeHelmet(head.link?.toComponent?.())}
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
    {getFaviconLinks(reduxData)}
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
              __html: `window.UWAZI_ENVIRONMENT = "${this.props.environment || process.env.ENVIRONMENT || 'development'}";window.UWAZI_VERSION = "${this.props.version || process.env.npm_package_version || 'development'}"`,
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
          {safeHelmet(head.script?.toComponent?.())}
          {JS.map((file, index) => (
            <script key={index} src={file} />
          ))}
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

export { headTag, Root };
