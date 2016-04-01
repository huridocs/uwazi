import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';

class DynamicForm extends Component {
  render() {
    return (
      <div>
        {this.props.dynamicFields.map((field, index) => {
          return (
            <div key={index}>
              <input {...this.props.fields[field.name]}/>
              <button onClick={() => this.props.removeField(index)}>Borrame</button>
            </div>
          );
        })}
      </div>
    );
  }
}

DynamicForm.propTypes = {
  dynamicFields: PropTypes.array,
  removeField: PropTypes.func,
  fields: PropTypes.object
};

export default reduxForm({form: 'form'})(DynamicForm);
