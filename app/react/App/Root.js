import PropTypes from 'prop-types';
import React, { Component } from 'react';
import serialize from 'serialize-javascript';

import { allLanguages as languagesList } from 'shared/languagesList';

const determineHotAssets = query => ({
  JS: [
    'http://localhost:8080/pdfjs-dist.js',
    'http://localhost:8080/nprogress.js',
    'http://localhost:8080/main.js',
    'http://localhost:8080/vendor.js',
  ],
  CSS: [
    `http://localhost:8080/CSS/vendor.css${query}`,
    `http://localhost:8080/CSS/main.css${query}`,
    'http://localhost:8080/pdfjs-dist.css',
  ],
});

const determineAssets = (assets, languageData) => ({
  JS: [assets['pdfjs-dist'].js, assets.nprogress.js, assets.vendor.js, assets.main.js],
  CSS: [
    assets.vendor.css[languageData.rtl ? 1 : 0],
    assets.main.css[languageData.rtl ? 1 : 0],
    assets['pdfjs-dist'].css[0],
  ],
});

const googelFonts = (
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css?family=Roboto+Mono:100,300,400,500,700|Roboto+Slab:100,300,400,700|Roboto:100,300,400,500,700,900"
  />
);

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
    {googelFonts}
    <link rel="shortcut icon" href="/public/favicon.ico" />
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

    return (
      <script dangerouslySetInnerHTML={{ __html: innerHtml }} /> //eslint-disable-line
    );
  }

  render() {
    const isHotReload = process.env.HOT;
    const { head, language, assets, reduxData, content } = this.props;

    const languageData = languagesList.find(l => l.key === language);
    const query = languageData && languageData.rtl ? '?rtl=true' : '';

    const { JS, CSS } = isHotReload
      ? determineHotAssets(query)
      : determineAssets(assets, languageData);

    return (
      <html lang={language}>
        {headTag(head, CSS, reduxData)}
        <body>
          <div id="root" dangerouslySetInnerHTML={{ __html: content }} />
          {this.renderInitialData()}
          {head.script.toComponent()}
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
};

export default Root;
