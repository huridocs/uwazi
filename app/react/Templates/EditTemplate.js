import React from 'react';
import {actions as formActions} from 'react-redux-form';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import {actions} from 'app/BasicReducer';
import RouteHandler from 'app/App/RouteHandler';
import ID from 'shared/uniqueID';

let prepareTemplate = (template) => {
  template.properties = template.properties.map((property) => {
    property.localID = ID();
    return property;
  });

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

  setReduxState({template, thesauris, templates}) {
    this.context.store.dispatch(formActions.load('template.data', template.data));
    this.context.store.dispatch(actions.set('thesauris', thesauris));
    this.context.store.dispatch(actions.set('templates', templates));
  }

  render() {
    return <TemplateCreator />;
  }

}
