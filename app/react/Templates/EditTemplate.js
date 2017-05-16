import React from 'react';
import {actions as formActions} from 'react-redux-form';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import {actions} from 'app/BasicReducer';
import RouteHandler from 'app/App/RouteHandler';
import ID from 'shared/uniqueID';
import templateCommonProperties from './utils/templateCommonProperties';

let prepareTemplate = (template) => {
  template.properties = template.properties.map((property) => {
    property.localID = ID();
    return property;
  });

  const commonPropertiesExists = template.commonProperties && template.commonProperties.length;
  template.commonProperties = commonPropertiesExists ? template.commonProperties : templateCommonProperties.get();

  return template;
};

export default class EditTemplate extends RouteHandler {

  static requestState({templateId}) {
    return Promise.all([
      templatesAPI.get(),
      thesaurisAPI.get()
    ])
    .then(([templates, thesauris]) => {
      let template = Object.assign({}, templates.find((tmpl) => tmpl._id === templateId));
      return {
        template: {
          data: prepareTemplate(template)
        },
        thesauris,
        templates
      };
    });
  }

  componentDidMount() {
    // patch to prevent an error on title edition when navigation back and forth on client side,
    // this need to be executed on client. should be in setReduxState but after serverside rendering its throwing an error
    // because this route is nested inside another, currently we do not have a good support for this
    this.context.store.dispatch(formActions.reset('template.data'));
  }

  setReduxState({template, thesauris, templates}) {
    this.context.store.dispatch(formActions.load('template.data', template.data));
    this.context.store.dispatch(actions.set('thesauris', thesauris));
    this.context.store.dispatch(actions.set('templates', templates));
  }

  render() {
    return <TemplateCreator />;
  }

}
