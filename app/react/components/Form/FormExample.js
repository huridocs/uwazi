import React, { Component, PropTypes } from 'react'
import ConfigInputField from './configFields/ConfigInputField.js'

class FormExample extends Component {

  constructor (props) {
    super(props);
    this.state = {fields: [{type:'input', label:'Short text', required: true}, {type:'select', label:'Dropdown', required: false}]};
  }

  addInput = () => {
    this.state.fields.push({type:'input', label:'Short text', required: false});
    this.setState(this.state);
  }

  save = (e) => {
    e.preventDefault();
    console.log(this.state);
  }

  remove = (index) => {
    this.state.fields.splice(index, 1);
    this.setState(this.state);
  }

  update = (index, field) => {
    this.state.fields[index] = field;
    this.setState(this.state);
  }

  render = () => {
    return (
      <div>
        <h1>Form Creator!</h1>
        <div className="row">
          <div className="col-xs-2">
            <a className="btn btn-primary glyphicon glyphicon-plus" onClick={this.addInput}> Add field</a>
          </div>
          <div className="col-xs-8">
            <form className="form-horizontal" onSubmit={this.save}>
                {this.state.fields.map((field, index) => {
                  return <ConfigInputField remove={this.remove.bind(this,index)} update={this.update.bind(this,index)} field={field} key={index} />
                })}
              <button type="submit" className="btn btn-default">Save !</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

}
export default FormExample;
