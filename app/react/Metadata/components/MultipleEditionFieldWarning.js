/** @format */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getField } from 'react-redux-form';
import { Icon } from 'UI';

// exported for testing.
export class MultipleEditionFieldWarningBase extends Component {
  render() {
    if (!this.props.touched || !this.props.multipleEdition) {
      return false;
    }
    return (
      <span>
        <Icon icon="exclamation-triangle" />
        &nbsp;
      </span>
    );
  }
}

MultipleEditionFieldWarningBase.propTypes = {
  touched: PropTypes.bool,
  multipleEdition: PropTypes.bool,
};

// exported for testing.
export const mapStateToProps = (state, props) => {
  const fieldState = getField(state, `${props.model}.${props.field}`) || { pristine: true };
  let touched = !fieldState.pristine;
  if (fieldState.$form) {
    touched = !fieldState.$form.pristine;
  }
  return { touched };
};

export default connect(mapStateToProps)(MultipleEditionFieldWarningBase);
