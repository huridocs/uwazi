import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PagesContext from './Context';
import { objectPath } from '../utils';

class Repeat extends Component {
  render() {
    const { path, children } = this.props;
    return (
      <PagesContext.Consumer>
        {data => objectPath(path, data).map((item, index) => (
          <PagesContext.Provider value={item} key={index}>
            {children}
          </PagesContext.Provider>
            ))}
      </PagesContext.Consumer>
    );
  }
}

Repeat.propTypes = {
  path: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
};

export default Repeat;
