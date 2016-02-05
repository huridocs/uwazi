import React, { Component, PropTypes } from 'react'
import api from '../../utils/singleton_api'
import FormCreator from '../../components/Form/FormCreator'
import RouteHandler from '../App/RouteHandler'
import Helmet from 'react-helmet'
import './scss/templates.scss'

class TemplatesController extends RouteHandler {

  static requestState(params = {}, api){
    return api.get('templates')
    .then((response) => {
      let templates = response.json.rows;
      return {
        templates:templates,
        template: templates.find(template => template.id == params.templateKey)
      };
    })
  };

  saveForm = (template) => {
    return api.post('templates', template)
    .then((response) => {
      return TemplatesController.requestState({templateKey:response.json.id}, api);
    })
    .then((state) => {
      this.setState(state);
    });
  };


  render = () => {
    return (
      <div className="metadata-templates">
        <Helmet title='Upload' />
        <FormCreator save={this.saveForm} templates={this.state.templates} templateId={this.props.params.templateId}/>
      </div>
    )
  };

}

export default TemplatesController;
