import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';

const FieldController = createFieldClass({
  Select: controls.select,
  DatePicker: controls.text
});

class FormField extends Component {
  render() {
    let field = React.cloneElement(this.props.children);
    if (this.props.model) {
      field = <FieldController model={this.props.model} validators={this.props.validators}>{field}</FieldController>;
    }

    return field;
  }
}

FormField.propTypes = {
  model: PropTypes.string,
  children: PropTypes.object.isRequired,
  validators: PropTypes.object
};

export default FormField;
export {FieldController};
