import React, { Component, PropTypes } from 'react'
import EmailField from './fields/EmailField.js'
import SelectField from './fields/SelectField.js'

class FormExample extends Component {

  constructor (props) {
    super(props);
    this.state = {fields: [{type:'email', label:'Email'}, {type:'select', label:'Select'}]};
  }

  render_fields = () => {

  }

  render = () => {
    return (
      <div>
        <h1>Form Creator apah!</h1>
        <form className="form-horizontal">
          <fieldset>
            {this.state.fields.map((field, index) => {
              if(field.type == 'email') { return <EmailField key={index}></EmailField> }
              if(field.type == 'select') { return <SelectField key={index}></SelectField> }
            })}
          </fieldset>
        </form>
      </div>
    )
  }

}
export default FormExample;
