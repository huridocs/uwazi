import React, { Component, PropTypes } from 'react'
import ConfigPanel from './ConfigPanel'
import Field from '../fields/Field'

class ConfigInputField extends Component {

  render = () => {
    return (
      <div className="row">
        <Field config={this.props.field}/>
        <ConfigPanel remove={this.props.remove} field={this.props.field} update={this.props.update}></ConfigPanel>
      </div>
    )
  }

}
export default ConfigInputField;
