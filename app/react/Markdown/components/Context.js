import React, { Component } from 'react';
import PropTypes from 'prop-types';

export const PagesContext = React.createContext('');
export default class Context extends Component {
  render() {
    const { children } = this.props;
    if (children.length) {
      return React.cloneElement(children[0], { data: this.context });
    }
    return (<PagesContext.Consumer>{value => value}</PagesContext.Consumer>);
  }
}

Context.defaultProps = {
  children: ''
};
Context.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};
