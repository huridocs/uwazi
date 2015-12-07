import React, { Component, PropTypes } from 'react'

class CheckBoxField extends Component {

  value = () => {
    return this.field.checked;
  }

  render = () => {
    return (

      <div className="form-group col-xs-9">
        <div className="checkbox">
          <label>
            <input
              type="checkbox"
              ref={(ref) => this.field = ref}
              defaultChecked={this.props.defaultValue}
            />
            {this.props.label}
          </label>
        </div>
      </div>

    )
  }
}
export default CheckBoxField;
