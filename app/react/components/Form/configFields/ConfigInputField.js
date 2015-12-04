import React, { Component, PropTypes } from 'react'
import ConfigPanel from './ConfigPanel'
import SelectField from '../fields/SelectField'
import InputField from '../fields/InputField'

class ConfigInputField extends Component {

  render = () => {
    return (
      <div className="row">
        {(() => {if(this.props.field.type == 'text') {return <InputField label={this.props.field.label}></InputField>}})()}
        {(() => {if(this.props.field.type == 'select') {return <SelectField label={this.props.field.label}></SelectField>}})()}
        <ConfigPanel remove={this.props.remove} field={this.props.field} update={this.props.update}></ConfigPanel>
      </div>
    )
  }

}
export default ConfigInputField;
