import PropTypes from 'prop-types';
import React, {Component} from 'react';

export class FormGroup extends Component {

  render() {
    let className = 'form-group';
    if ((this.props.touched === true || this.props.submitFailed) && this.props.valid === false) {
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
  touched: PropTypes.bool,
  valid: PropTypes.bool,
  submitFailed: PropTypes.bool,
  children: childrenType
};

export default FormGroup;
