import React, {Component, PropTypes} from 'react';

export class FormGroup extends Component {

  render() {
    let className = 'form-group';
    if ((this.props.touched || this.props.submitFailed) && !this.props.valid) {
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
  properties: PropTypes.object,
  label: PropTypes.string,
  touched: PropTypes.bool,
  valid: PropTypes.bool,
  submitFailed: PropTypes.bool,
  children: childrenType
};

export default FormGroup;
