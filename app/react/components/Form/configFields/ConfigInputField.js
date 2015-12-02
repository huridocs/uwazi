import React, { Component, PropTypes } from 'react'
import InputConfigButtons from './InputConfigButtons'

class ConfigInputField extends Component {

  render = () => {
    return (
      <div className="form-group row">
        <label htmlFor="label" className="col-lg-2 control-label">{this.props.field.label}</label>
        <div className="col-lg-8">
          <input type="text" className="form-control" id="label" placeholder="placeholder"/>
        </div>
        <InputConfigButtons remove={this.props.remove}></InputConfigButtons>
      </div>
    )
  }

}
export default ConfigInputField;
