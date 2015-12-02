import React, { Component, PropTypes } from 'react'
import ConfigInputField from './configFields/ConfigInputField.js'
import ConfigSelectField from './configFields/ConfigSelectField.js'

class FormExample extends Component {

  constructor (props) {
    super(props);
    this.state = {fields: [{type:'text', label:'Email'}, {type:'select', label:'Select'}]};
  }

  addInput = () => {
    this.state.fields.push({type:'text', label:'Email'});
    this.setState(this.state);
  }

  addSelect = () => {
    this.state.fields.push({type:'select', label:'Select'});
    this.setState(this.state);
  }

  remove = (index) => {
    this.state.fields.splice(index, 1);
    this.setState(this.state);
  }

  render = () => {
    return (
      <div>
        <h1>Form Creator apah!</h1>
        <div className="row">
          <div className="col-xs-2">
            <a className="btn btn-primary" onClick={this.addInput}>Add input field</a>
            <br/><br/>
            <a className="btn btn-primary" onClick={this.addSelect}>Add select field</a>
          </div>
          <div className="col-xs-8">
            <form className="form-horizontal">
              <fieldset>
                {this.state.fields.map((field, index) => {
                  if(field.type == 'text') { return <ConfigInputField remove={this.remove.bind(this,index)} field={field} key={index}></ConfigInputField> }
                  if(field.type == 'select') { return <ConfigSelectField remove={this.remove.bind(this,index)} field={field} key={index}></ConfigSelectField> }
                })}
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    )
  }

}
export default FormExample;
