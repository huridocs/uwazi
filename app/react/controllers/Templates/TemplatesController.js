import React from 'react';
import API from '../../utils/singleton_api';
import FormCreator from '../../components/Form/FormCreator';
import RouteHandler from '../App/RouteHandler';
import Helmet from 'react-helmet';
import './scss/templates.scss';

class TemplatesController extends RouteHandler {

  static requestState(params = {}, api) {
    return api.get('templates')
    .then((response) => {
      let templates = response.json.rows;
      return {
        templates: templates,
        template: templates.find(template => template.id === params.templateId)
      };
    });
  }

  static emptyState() {
    return {templates: [], template: {}};
  }

  saveForm(template) {
    return API.post('templates', template)
    .then((response) => {
      return TemplatesController.requestState({templateId: response.json.id}, API);
    })
    .then((state) => {
      this.setState(state);
    });
  }


  render() {
    return (
      <div className="metadata-templates">
        <Helmet title='Upload' />
        <FormCreator
          save={this.saveForm.bind(this)}
          templates={this.state.templates}
          templateId={this.props.params.templateId}
        />
      </div>
    );
  }

}

export default TemplatesController;
