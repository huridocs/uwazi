import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';
import DropdownList from './DropdownList';

const FieldController = createFieldClass({
  Select: controls.select,
  MultiSelect: controls.select,
  MultiDate: controls.select,
  MultiDateRange: controls.select,
  DatePicker: controls.text,
  MarkDown: controls.text,
  Nested: controls.select,
  NestedMultiselect: controls.select,
  DropdownList: controls.select
}, {
  componentMap: {
    DropdownList: DropdownList
  }
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
