import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import markdownDatasets from '../markdownDatasets';
import PagesContext from './Context';
import { objectPath } from '../utils';

export class ValueComponent extends Component {
  renderChildren(_value) {
    const { children, propkey, path } = this.props;
    const value = path ? objectPath(path, _value) : _value;
    const child = Array.isArray(children) ? children[0] : children;
    if (!child) {
      return value;
    }
    const props = { [propkey]: value };
    return React.cloneElement(child, props);
  }

  render() {
    const { path, value } = this.props;
    return path ? (<PagesContext.Consumer>{val => this.renderChildren(val)}</PagesContext.Consumer>) : this.renderChildren(value);
  }
}

ValueComponent.defaultProps = {
  value: '-',
  children: '',
  propkey: 'data',
  path: '',
};

ValueComponent.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]),
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  propkey: PropTypes.string,
  path: PropTypes.string,
};

export const mapStateToProps = (state, props) => props.property ? { value: markdownDatasets.getMetadataValue(state, props) } : {};

export default connect(mapStateToProps)(ValueComponent);
