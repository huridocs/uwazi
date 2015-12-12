import React, { Component, PropTypes } from 'react'

class TextareaField extends Component {

  // value = () => {
  //   return this.field.value
  // }

  render = () => {
    return (
      <div className="form-group col-xs-9">
        <label htmlFor="label" className="col-xs-2 control-label">{this.props.label}</label>
        <div className="col-xs-10">
          <textarea
            className="form-control"
            rows="3"

            defaultValue={this.props.defaultValue}
            ref={(ref) => this.field = ref}
          ></textarea>
        </div>
      </div>
    )
  }

}
export default TextareaField;
