import React, { Component, PropTypes } from 'react'
import ConfigInputField from './configFields/ConfigInputField.js'
import TemplatesList from './TemplatesList.js'
import InputField from './fields/InputField.js'
import api from '../../utils/api'

class FormCreator extends Component {

  static contextTypes = {
    getInitialData: PropTypes.func
  }

  static defaultTemplate = {
    name:'template name',
    fields: [
      {type:'input', label:'Short textsss', required: true},
      {type:'select', label:'Dropdown', required: false}
    ]
  };


  static requestState(params) {
    return Promise.all([
      api.get('templates'),
      FormCreator.requestTemplate(params.templateId)
    ])
    .then(responses => {
      return {
        templates: responses[0].json.rows,
        template: responses[1]
      };
    })
  }

  static requestTemplate(templateId) {
    if(templateId){
      return api.get('templates?_id='+templateId)
      .then((response) => response.json.rows[0].value);
    }
    return Promise.resolve(FormCreator.defaultTemplate)
  }

  constructor (props, context) {
    super(props, context);

    this.templateId = props.params.templateId;

    if (!context.getInitialData(this)) {
      FormCreator.requestState(props.params)
      .then(state => { this.setState(state); });
    }

    this.state = context.getInitialData(this);

    if(!this.state){
      this.state = {
        template: {fields:[]},
        templates: []
      }
    }

  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.params.templateId && this.props.params != nextProps.params) {
      FormCreator.requestTemplate(nextProps.params.templateId)
      .then(template => {
        template.fields = template.fields || [];
        this.setState({ template: template });
      });
    }

    if(!nextProps.params.templateId){
      this.setState({ template: FormCreator.defaultTemplate });
    }
  }

  addInput = () => {
    this.state.template.fields.push({type:'input', label:'Short text', required: false});
    this.setState(this.state);
  }

  save = (e) => {
    e.preventDefault();
    this.state.template.name = this.inputName.value();
    return api.post('templates', this.state.template)
    .then((response) => this.setState({}));
  }

  remove = (index) => {
    this.state.template.fields.splice(index, 1);
    this.setState(this.state);
  }

  update = (index, field) => {
    this.state.template.fields[index] = field;
    this.setState(this.state);
  }

  render = () => {
    return (
      <div>
        <h1>Form Creator!</h1>
        <div className="row">
          <div className="col-xs-2">
            <a className="btn btn-primary glyphicon glyphicon-plus" onClick={this.addInput}> Add field</a>
            <TemplatesList templates={this.state.templates || []}/>
          </div>
          <div className="col-xs-8">
            <InputField label="Template name" value={this.state.template.name} ref={(ref) => this.inputName = ref}/>
            <form className="form-horizontal" onSubmit={this.save}>
              {this.state.template.fields.map((field, index) => {
                return <ConfigInputField remove={this.remove.bind(this,index)} save={this.update.bind(this,index)} field={field} key={index} />
              })}
              <button type="submit" className="btn btn-default">Save !</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

}

export default FormCreator;
