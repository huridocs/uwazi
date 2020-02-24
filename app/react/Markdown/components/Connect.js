import { connectAdvanced } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PagesContext from './Context';
import { objectPath } from '../utils';

class Connect extends Component {
  static objectPath(path, object) {
    return path.split('.').reduce((o, key) => (o.toJS ? o.get(key) : o[key]), object);
  }

  static renderChildren(children, props) {
    return Array.isArray(children)
      ? children.map((child, index) => React.cloneElement(child, { ...props, index }))
      : React.cloneElement(children, props);
  }

  render() {
    const { children } = this.props;
    const props = Object.assign({}, this.props);
    delete props.children;
    return (
      <PagesContext.Provider value={props}>
        {Connect.renderChildren(children, props)}
      </PagesContext.Provider>
    );
  }
}

Connect.propTypes = {
  children: PropTypes.node.isRequired,
};

export const mapStateToProps = (state, props) =>
  Object.keys(props).reduce((mappedProps, propName) => {
    if (propName === 'children') {
      return Object.assign(mappedProps, { children: props.children });
    }

    const value = objectPath(props[propName], state);
    return Object.assign(mappedProps, { [propName]: value });
  }, {});

export default connectAdvanced(() => mapStateToProps)(Connect);
