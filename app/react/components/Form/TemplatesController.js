import React, { Component, PropTypes } from 'react'
import api from '../../utils/api'
import FormCreator from './FormCreator'
import RouteHandler from '../../core/RouteHandler'

class TemplatesController extends RouteHandler {

  static requestState(params = {}){
    return api.get('templates')
    .then((response) => {
      let templates = response.json.rows;
      return {
        templates:templates,
        template: templates.find(template => template.id == params.templateKey)
      };
    })
  };

  constructor(props, context){
    super(props, context);
  };

  saveForm = (template) => {
    return api.post('templates', template)
    .then((response) => {
      return TemplatesController.requestState({templateKey:response.json.id});
    })
    .then((state) => {
      this.setState(state);
    });
  };


  render = () => {
    return (
      <div>
        <FormCreator save={this.saveForm} templates={this.state.templates} templateId={this.props.params.templateId}/>
      </div>
    )
  };

}

export default TemplatesController;
