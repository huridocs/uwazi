import React, {Component, PropTypes} from 'react';

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
    const isDeveloping = process.env.NODE_ENV !== 'production';
    const head = this.props.head;

    return (
      <html>
        <head>
          {head.title.toComponent()}
          {head.meta.toComponent()}
          {head.link.toComponent()}
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link
            href={isDeveloping ? '/style.css' : '/style.css'}
            rel="stylesheet"
            type="text/css"
          />
          <link
          href="https://fonts.googleapis.com/css?family=Open+Sans:400,300,300italic,400italic,600,600italic,700,700italic,800,800italic|Roboto:400,100,100italic,300,300italic,400italic,500,500italic,700,700italic,900,900italic|Lato:400,100,100italic,300,300italic,400italic,700,700italic,900,900italic|Source+Sans+Pro:400,200,200italic,300,300italic,400italic,600,600italic,700,700italic,900,900italic|Ubuntu:400,300,300italic,400italic,500,500italic,700,700italic|Roboto+Slab:400,100,300,700|Droid+Serif:400,400italic,700,700italic|Merriweather:400,300,300italic,400italic,700,700italic,900,900italic|Lora:400,400italic,700,700italic" //eslint-disable-line
          rel="stylesheet"
          type="text/css"
          />
          <link rel="shortcut icon" href="/public/favicon.ico"/>
        </head>
        <body>
          <div id="root" dangerouslySetInnerHTML={{__html: this.props.content}} />
          {this.renderInitialData()}
          {head.script.toComponent()}
          <script src={isDeveloping ? '/bundle.js' : '/bundle.js'}></script>
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
  content: PropTypes.string
};

export default Root;
