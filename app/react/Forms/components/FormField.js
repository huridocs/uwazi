import React, {Component, PropTypes} from 'react';
import {createFieldClass, controls} from 'react-redux-form';

const FieldController = createFieldClass({
  Select: controls.select
});

class FormField extends Component {
  render() {
    let field = React.cloneElement(this.props.children, {className: 'form-control'});
    if (this.props.model) {
      field = <FieldController model={this.props.model}>{field}</FieldController>;
    }

    return field;
  }
}

FormField.propTypes = {
  model: PropTypes.string,
  children: PropTypes.object.isRequired
};

export default FormField;
export {FieldController};
