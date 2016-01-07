import React, { Component, PropTypes } from 'react'
import Field from './fields/Field'

class Form extends Component {

  // constructor(props) {
  //   super(props),
  //   this.state = {value: props.value};
  // }

  // value = () => {
  //   return this.field.value
  // }

  handleChange = () => {
    this.setState({value: this.value()});
  }

  // componentDidUpdate = (prevProps) => {
  //   if(prevProps.value !== this.props.value){
  //     this.setState({value:this.props.value});
  //   }
  // }

  render = () => {
    return (
      <form>
        {this.props.fields.map((field, index) => {
          return <Field config={field} key={index}/>
        })}
      </form>
    )
  }

}
export default Form;
