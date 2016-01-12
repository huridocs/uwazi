import React, { Component, PropTypes } from 'react'
import Field from './fields/Field'

class Form extends Component {

  constructor(props) {
    super(props),
    this.fields = {};
    this.state = {};
    this.state.values = this.props.values || {};
  }

  value = () => {
    let values = {};

    Object.keys(this.fields).forEach((fieldName) => {
      if(this.fields[fieldName]){
        values[fieldName] = this.fields[fieldName].value();
      }
    });

    return values;
  }

  componentDidUpdate = (prevProps) => {
    if(prevProps.values !== this.props.values){
      this.setState({values:this.props.values});
    }
  }

  render = () => {
    return (
      <form>
        {this.props.fields.map((field, index) => {
          field.value = this.state.values[field.name];
          return <Field config={field} key={index} ref={(ref) => this.fields[field.name] = ref }/>
        })}
      </form>
    )
  }

}
export default Form;
