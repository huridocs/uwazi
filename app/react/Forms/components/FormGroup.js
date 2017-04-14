import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {getField} from 'react-redux-form';

export class FormGroup extends Component {
  render() {
    let className = 'form-group';
    if (this.props.hasError) {
      className += ' has-error';
    }

    return (
      <div className={className}>
        {this.props.children}
      </div>
    );
  }

}

let childrenType = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.array
]);

FormGroup.propTypes = {
  hasError: PropTypes.bool,
  model: PropTypes.any,
  children: childrenType
};

export const mapStateToProps = (state, props) => {
  if (props.model) {
    const fieldState = getField(state, props.model + '.' + props.field);
    if (!fieldState) {
      return {hasError: false};
    }

    const touched = !fieldState.pristine || fieldState.$form && !fieldState.$form.pristine;
    const invalid = fieldState.valid === false || !!fieldState.$form && fieldState.$form.valid === false;
    return {hasError: (touched || fieldState.submitFailed) && invalid};
  }

  const touched = !props.pristine || props.$form && !props.$form.pristine;
  const invalid = props.valid === false || !!props.$form && props.$form.valid === false;
  return {hasError: (touched || props.submitFailed) && invalid};
};

export default connect(mapStateToProps)(FormGroup);
