import React, { Component, PropTypes } from 'react'

class InputField extends Component {

  value = () => {
    return this.field.value
  }

  render = () => {
    return (
      <div className="form-group col-xs-9">
        <label htmlFor="label" className="col-xs-2 control-label">{this.props.label}</label>
        <div className="col-xs-10">
          <input type="text"
            className="form-control"
            id="label"
            ref={(ref) => this.field = ref}
            defaultValue={this.props.defaultValue}
            placeholder="placeholder"
          />
        </div>
      </div>
    )
  }

}
export default InputField;
