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
    //const isDeveloping = process.env.NODE_ENV !== 'production';
    const head = this.props.head;

    var pdfWorkerPathScript = `window.pdfWorkerPath = '${this.props.assets['pdf.worker'].js}';`;

    return (
      <html>
        <head>
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {head.link.toComponent()}
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link
            href={this.props.assets.main.css[0]}
            rel="stylesheet"
            type="text/css"
          />
          <link
            href={this.props.assets.main.css[1]}
            rel="stylesheet"
            type="text/css"
          />
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
          <script defer src={this.props.assets.manifest.js}></script>
          <script defer src={this.props.assets.nprogress.js}></script>
          <script defer src={this.props.assets.vendor.js}></script>
          <script defer src={this.props.assets.main.js}></script>
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
