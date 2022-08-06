import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Control } from 'react-redux-form';

const mapProps = {
  className: ({ fieldValue }) => {
    const _fieldValue = fieldValue.$form || fieldValue;
    return _fieldValue.submitFailed && !_fieldValue.valid ? 'has-error' : '';
  },
};

function controlComponent(className) {
  // eslint-disable-next-line react/prop-types
  return props => <div className={`${className} ${props.className}`}>{props.children}</div>;
}

export class FormGroup extends Component {
  render() {
    if (this.props.model) {
      const className = `form-group ${this.props.className || ''}`;
      return (
        <Control.custom
          model={this.props.model}
          component={controlComponent(className)}
          mapProps={mapProps}
        >
          {this.props.children}
        </Control.custom>
      );
    }

    return <div className={`form-group ${this.props.className}`}>{this.props.children}</div>;
  }
}

const childrenType = PropTypes.oneOfType([PropTypes.object, PropTypes.array]);

FormGroup.defaultProps = {
  hasError: false,
  className: '',
  model: '',
  children: PropTypes.any,
};

FormGroup.propTypes = {
  hasError: PropTypes.bool,
  className: PropTypes.string,
  model: PropTypes.any,
  children: childrenType,
};

export default connect()(FormGroup);
