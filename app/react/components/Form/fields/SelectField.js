import React, { Component, PropTypes } from 'react'

class SelectField extends Component {

  value = () => {
    return this.field.value;
  }

  render = () => {
    let selectOptions = this.props.options || [];
    return (
      <div className="form-group col-xs-9">
        <label htmlFor="select" className="col-sm-2 control-label">{this.props.label}</label>
        <div className="col-xs-10">
          <select className="form-control" id="select" onChange={this.props.onChange} defaultValue={this.props.defaultValue} ref={(ref) => {this.field = ref}}>
            {selectOptions.map((data, index) => {
              return <option key={index} value={data.value}>{data.label}</option>
            })}
          </select>
        </div>
      </div>
    )
  }

}
export default SelectField;
