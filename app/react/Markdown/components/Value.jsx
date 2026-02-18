import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import markdownDatasets from '../markdownDatasets.js';
import { Context as PagesContext } from './Context.js';
import { objectPath } from '../utils.js';

export class ValueComponent extends Component {
  renderChildren(_value) {
    const { path } = this.props;
    return path ? objectPath(path, _value) : _value;
  }

  render() {
    const { property, value } = this.props;
    return property ? (
      this.renderChildren(value)
    ) : (
      <PagesContext.Consumer>{val => this.renderChildren(val)}</PagesContext.Consumer>
    );
  }
}

ValueComponent.defaultProps = {
  value: '-',
  path: '',
  property: '',
};

ValueComponent.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  path: PropTypes.string,
  property: PropTypes.string,
};

export const mapStateToProps = (state, props) =>
  props.property ? { value: markdownDatasets.getMetadataValue(state, props) } : {};

const Value = connect(mapStateToProps)(ValueComponent);
export { Value };
