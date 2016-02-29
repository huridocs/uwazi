import React, { Component, PropTypes } from 'react'
import Field from './fields/Field'

class Form extends Component {

  constructor(props) {
    super(props);
    this.fields = {};
  };

  value = () => {
    let values = {};

    Object.keys(this.fields).forEach((fieldName) => {
      if(this.fields[fieldName]){
        values[fieldName] = this.fields[fieldName].value();
      }
    });

    return values;
  };

  render = () => {

    return (
      <form>
        {this.props.fields.map((fieldConfig, index) => {
          fieldConfig.value = this.props.values[fieldConfig.name];
          return <Field config={fieldConfig} key={index} ref={(ref) => this.fields[fieldConfig.name] = ref }/>
        })}
      </form>
    )
  };

}

Form.defaultProps = {values:{}};

export default Form;
