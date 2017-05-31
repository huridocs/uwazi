import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import Helmet from 'react-helmet';

class NoMatch extends RouteHandler {

  render() {
    return (
      <div>
        <Helmet title='Not Found' />
        <h2>404</h2>
      </div>
    );
  }
}

export default NoMatch;
