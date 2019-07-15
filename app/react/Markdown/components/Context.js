import React, { Component } from 'react';
import PropTypes from 'prop-types';

export const PagesContext = React.createContext('');
export default class Context extends Component {
  static objectPath(path, object) {
    return object.toJS ? object.getIn(path.split('.')) : path.split('.').reduce((o, key) => o[key], object);
  }

  renderChildren(_value) {
    const { children, propkey, path } = this.props;
    const value = path ? Context.objectPath(path, _value) : _value;
    if (!children || !children.length) {
      return value;
    }
    const props = { [propkey]: value };
    return React.cloneElement(children[0], props);
  }

  render() {
    return (<PagesContext.Consumer>{value => this.renderChildren(value)}</PagesContext.Consumer>);
  }
}

Context.defaultProps = {
  children: '',
  propkey: 'data',
  path: '',
};
Context.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  propkey: PropTypes.string,
  path: PropTypes.string,
};
