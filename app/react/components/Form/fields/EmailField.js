import React, { Component, PropTypes } from 'react'

class EmailField extends Component {

  render = () => {
    return (
      <div className="form-group">
        <label htmlFor="inputEmail" className="col-lg-2 control-label">Email</label>
        <div className="col-lg-10">
          <input type="email" className="form-control" id="inputEmail" placeholder="Email"/>
        </div>
      </div>
    )
  }

}
export default EmailField;
