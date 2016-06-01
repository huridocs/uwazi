import React, {Component} from 'react';
import Helmet from 'react-helmet';

class NoMatch extends Component {

  render() {
    return (
      <div>
        <Helmet title='Not Found' />
        <h2>404</h2> Page was not found
      </div>
    );
  }
}

export default NoMatch;
