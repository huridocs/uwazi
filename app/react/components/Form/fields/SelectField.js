import React, { Component, PropTypes } from 'react'

class SelectField extends Component {

  render = () => {
    return (
      <div className="form-group">
        <label htmlFor="select" className="col-lg-2 control-label">Selects</label>
        <div className="col-lg-10">
          <select className="form-control" id="select">
            <option>1</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
          </select>
        </div>
      </div>
    )
  }

}
export default SelectField;
