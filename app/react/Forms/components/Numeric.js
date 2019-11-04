/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { UnwrapMetadataObject } from './MetadataUtil';

export default class Numeric extends Component {
  onChange(e) {
    const { value } = e.target;
    const { onChange } = UnwrapMetadataObject(this.props);
    if (!value) {
      return onChange('');
    }

    const numericValue = parseFloat(value);
    return onChange(numericValue);
  }

  render() {
    const { value } = UnwrapMetadataObject(this.props);
    return (
      <input className="form-control" onChange={this.onChange.bind(this)} value={value || ''} />
    );
  }
}

Numeric.defaultProps = {
  value: '',
};

Numeric.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.any,
};
