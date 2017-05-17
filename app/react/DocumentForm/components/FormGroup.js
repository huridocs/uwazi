import PropTypes from 'prop-types';
import React, {Component} from 'react';

export class FormGroup extends Component {

  render() {
    let className = 'form-group';
    if ((!this.props.pristine || this.props.submitFailed) && this.props.valid === false) {
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
  pristine: PropTypes.bool,
  valid: PropTypes.bool,
  submitFailed: PropTypes.bool,
  children: childrenType
};

export default FormGroup;
