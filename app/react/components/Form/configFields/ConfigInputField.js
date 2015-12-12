import React, { Component, PropTypes } from 'react'
import ConfigFieldPanel from '../ConfigFieldPanel'
import Field from '../fields/Field'

class ConfigInputField extends Component {

  render = () => {
    return (
      <div className="row">
        <Field config={this.props.field}/>
        <ConfigFieldPanel remove={this.props.remove} field={this.props.field} update={this.props.update}></ConfigFieldPanel>
      </div>
    )
  }

}
export default ConfigInputField;
