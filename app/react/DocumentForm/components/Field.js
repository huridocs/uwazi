import React, {Component, PropTypes} from 'react';
import { createFieldClass, controls } from 'react-redux-form';

export class FormGroup extends Component {

  render() {
    const {label} = this.props;
    let className = 'form-group';
    if (this.props.touched && !this.props.valid) {
      className += ' has-error';
    }
    return (
      <div className={className}>
        {this.props.children}
      </div>
    );
  }

}

FormGroup.propTypes = {
  properties: PropTypes.object,
  label: PropTypes.string
};

export default FormGroup;
