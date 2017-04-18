import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {getField} from 'react-redux-form';

export class MultipleEditionFieldWarning extends Component {
  render() {
    if (!this.props.touched || !this.props.multipleEdition) {
      return false;
    }
    return <span><i className="fa fa-warning"></i>&nbsp;</span>;
  }
}

MultipleEditionFieldWarning.propTypes = {
  touched: PropTypes.bool,
  multipleEdition: PropTypes.bool
};

export const mapStateToProps = (state, props) => {
  const fieldState = getField(state, props.model + '.' + props.field) || {pristine: true};
  let touched = !fieldState.pristine;
  if (fieldState.$form) {
    touched = !fieldState.$form.pristine;
  }
  return {touched};
};

export default connect(mapStateToProps)(MultipleEditionFieldWarning);
