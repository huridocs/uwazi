import PropTypes from 'prop-types';
import React, { Component } from 'react';
import serialize from 'serialize-javascript';

import laguagesList from '../Settings/utils/languagesList';

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
    const { head } = this.props;
    let JS = [
      'http://localhost:8080/pdfjs-dist.js',
      'http://localhost:8080/nprogress.js',
      'http://localhost:8080/main.js',
      'http://localhost:8080/vendor.js',
    ];

    const languageData = laguagesList.find(l => l.key === this.props.language);
    let query = '';
    if (languageData.rtl) {
      query = '?rtl=true';
    }

    let CSS = [
      `http://localhost:8080/CSS/vendor.css${query}`,
      `http://localhost:8080/CSS/main.css${query}`,
      'http://localhost:8080/pdfjs-dist.css',
    ];

    if (!isHotReload) {
      JS = [
        this.props.assets['pdfjs-dist'].js,
        this.props.assets.nprogress.js,
        this.props.assets.vendor.js,
        this.props.assets.main.js,
      ];
      CSS = [
        this.props.assets.vendor.css[languageData.rtl ? 1 : 0],
        this.props.assets.main.css[languageData.rtl ? 1 : 0],
        this.props.assets['pdfjs-dist'].css[0],
      ];
    }

    return (
      <html lang={this.props.language}>
        <head>
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {head.link.toComponent()}
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          {CSS.map((style, key) => <link key={key} href={style} rel="stylesheet" type="text/css" />)}
          <style type="text/css" dangerouslySetInnerHTML={{ __html: this.props.reduxData.settings.collection.customCSS }} />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto+Mono:100,300,400,500,700|Roboto+Slab:100,300,400,700|Roboto:100,300,400,500,700,900"
          />
          <link rel="shortcut icon" href="/public/favicon.ico"/>
        </head>
        <body>
          <div id="root" dangerouslySetInnerHTML={{ __html: this.props.content }} />
          {this.renderInitialData()}
          {head.script.toComponent()}
          {JS.map((file, index) => <script key={index} src={file} />)}
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
  assets: PropTypes.object
};

export default Root;
