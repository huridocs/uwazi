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
          <link href="https://fonts.googleapis.com/css?family=Roboto+Mono:100,300,400,500,700|Roboto+Slab:100,300,400,700|Roboto:100,300,400,500,700,900" //eslint-disable-line
                rel="stylesheet"
                type="text/css"/>
          <link rel="shortcut icon" href="/public/favicon.ico"/>
        </head>
        <body>
          <div id="root" dangerouslySetInnerHTML={{__html: this.props.content}} />
          {this.renderInitialData()}
          {head.script.toComponent()}
          <script src={isDeveloping ? '/main.bundle.js' : '/main.bundle.js'}></script>
          <script src='/nprogress/nprogress.js'></script>
          <link rel='stylesheet' href='/nprogress/nprogress.css'/>
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
