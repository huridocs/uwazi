import React, { Component, PropTypes } from 'react'
import ConfigInputField from './configFields/ConfigInputField.js'
import TemplatesList from './TemplatesList.js'
import InputField from './fields/InputField.js'
import api from '../../utils/singleton_api'
import './scss/formcreator.scss'

class FormCreator extends Component {

  static defaultTemplate = {
    name:'template name',
    fields: [
      {type:'input', label:'Short textsss', required: true},
      {type:'select', label:'Dropdown', required: false}
    ]
  };


  constructor (props, context) {
    super(props, context);
    this.state = {
      templates: props.templates,
      template: this.defaultTemplate()
    }
  };

  defaultTemplate(){
    return {name:'', fields:[]};
  };

  componentWillReceiveProps = (props) => {

    let template = this.defaultTemplate();
    if(props.templateId) {
      template = props.templates.find(template => template.key == props.templateId).value;
    }

    this.setState({
      templates: props.templates,
      template: template
    });
  };

  addInput = () => {
    this.state.template.fields.push({type:'input', label:'Short text', required: false});
    console.log('here!');
    this.setState(this.state);
  };

  save = (e) => {
    e.preventDefault();
    this.state.template.name = this.inputName.value();
    this.props.save(this.state.template);
  };

  remove = (index) => {
    this.state.template.fields.splice(index, 1);
    this.setState(this.state);
  };

  update = (index, field) => {
    this.state.template.fields[index] = field;
    this.setState(this.state);
  };

  render = () => {
    return (
      <div>
        <div className="row">
          <div className="col-xs-4">
            <TemplatesList templates={this.state.templates || []} active={this.state.template}/>
          </div>
          <div className="col-xs-offset-1 col-xs-6">
            <h4>Template name</h4>
            <InputField value={this.state.template.name} ref={(ref) => this.inputName = ref}/>
            <form onSubmit={this.save}>
              {this.state.template.fields.map((field, index) => {
                return <ConfigInputField remove={this.remove.bind(this,index)} save={this.update.bind(this,index)} field={field} key={index} />
              })}
              <a className="btn btn-default" onClick={this.addInput}>Add field</a>
              &nbsp;
              <button type="submit" className="btn btn-default">Save</button>
            </form>
          </div>
        </div>
      </div>
    )
  };

}

export default FormCreator;
