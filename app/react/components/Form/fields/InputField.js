import React, { Component, PropTypes } from 'react'

class InputField extends Component {

  render = () => {
    return (
      <div className="form-group">
        <label htmlFor="label" className="col-lg-2 control-label">Label</label>
        <div className="col-lg-10">
          <input type="text" className="form-control" id="label" placeholder="placeholder"/>
        </div>
      </div>
    )
  }

}
export default InputField;
