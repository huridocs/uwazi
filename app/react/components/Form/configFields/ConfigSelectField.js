import React, { Component, PropTypes } from 'react'
import InputConfigButtons from './InputConfigButtons'

class ConfigSelectField extends Component {

  render = () => {
    return (
      <div className="form-group">
        <label htmlFor="select" className="col-lg-2 control-label">{this.props.field.label}</label>
        <div className="col-lg-8">
          <select className="form-control" id="select">
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
          </select>
        </div>
        <InputConfigButtons remove={this.props.remove}></InputConfigButtons>
      </div>
    )
  }

}
export default ConfigSelectField;
