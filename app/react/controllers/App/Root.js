import React, { Component } from 'react'

class Root extends Component {

  renderInitialData() {
    let innerHtml = ''
    if (this.props.initialData) {
      innerHtml += `window.__initialData__ = ${JSON.stringify(this.props.initialData)};`;
    }

    if (this.props.user) {
      innerHtml += `window.__user__ = ${JSON.stringify(this.props.user)};`;
    }

    return (
      <script dangerouslySetInnerHTML={{__html: innerHtml}} />
    );
  }

  render() {
    const isDeveloping = process.env.NODE_ENV !== 'production';
    const head = this.props.head;

    return (
      <html>
        <head>
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {head.link.toComponent()}
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href="/dist/css/bootstrap.css" />
        </head>
        <body>
          <div id='root' dangerouslySetInnerHTML={{__html: this.props.content}} />
          {this.renderInitialData()}
          {head.script.toComponent()}
          <script src={isDeveloping ? '/bundle.js' : '/bundle.min.js'}></script>
        </body>
      </html>
    );
  }
}

export default Root;
