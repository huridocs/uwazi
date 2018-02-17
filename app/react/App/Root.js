import PropTypes from 'prop-types';
import React, {Component} from 'react';

class Root extends Component {

  renderInitialData() {
    let innerHtml = '';
    if (this.props.initialData) {
      innerHtml += `window.__initialData__ = ${JSON.stringify(this.props.initialData)};`;
    }
    if (this.props.reduxData) {
      innerHtml += `window.__reduxData__ = ${JSON.stringify(this.props.reduxData)};`;
    }

    if (this.props.user) {
      innerHtml += `window.__user__ = ${JSON.stringify(this.props.user)};`;
    }

    return (
      <script dangerouslySetInnerHTML={{__html: innerHtml}} />
    );
  }

  render() {
    const isProduction = process.env.NODE_ENV === 'production';
    const head = this.props.head;
    let pdfWorkerPathScript = 'window.pdfWorkerPath = \'/static/pdf.worker.js\';';
    let JS = [
      'http://localhost:8080/manifest.js',
      'http://localhost:8080/nprogress.js',
      'http://localhost:8080/vendor.js',
      'http://localhost:8080/main.js'
    ];

    let CSS = [
      'http://localhost:8080/vendor.styles.css',
      'http://localhost:8080/styles.css'
    ];

    if (isProduction) {
      pdfWorkerPathScript = `window.pdfWorkerPath = '${this.props.assets['pdf.worker'].js}';`;
      JS = [
        this.props.assets.manifest.js,
        this.props.assets.nprogress.js,
        this.props.assets.vendor.js,
        this.props.assets.main.js
      ];
      CSS = [
        this.props.assets.main.css[0],
        this.props.assets.main.css[1]
      ];
    }

    return (
      <html>
        <head>
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {head.link.toComponent()}
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          {CSS.map((style, key) => {
            return <link key={key} href={style} rel="stylesheet" type="text/css" />;
          })}
          <link rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto+Mono:100,300,400,500,700|Roboto+Slab:100,300,400,700|Roboto:100,300,400,500,700,900"
          />
          <link rel="shortcut icon" href="/public/favicon.ico"/>
        </head>
        <body>
          <div id="root" dangerouslySetInnerHTML={{__html: this.props.content}} />
          {this.renderInitialData()}
          {head.script.toComponent()}
          <script dangerouslySetInnerHTML={{__html: pdfWorkerPathScript}} />
          {JS.map((file, index) => {
            return <script key={index} src={file} />;
          })}
        </body>
      </html>
    );
  }
}

Root.propTypes = {
  user: PropTypes.object,
  children: PropTypes.object,
  initialData: PropTypes.object,
  reduxData: PropTypes.object,
  head: PropTypes.object,
  content: PropTypes.string,
  assets: PropTypes.object
};

export default Root;
