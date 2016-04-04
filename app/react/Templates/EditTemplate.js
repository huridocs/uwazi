import React from 'react';
import Immutable from 'immutable';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import {setTemplate} from 'app/Templates/actions/templateActions';
import {setThesauri} from 'app/Templates/actions/uiActions';
import RouteHandler from 'app/controllers/App/RouteHandler';
import ID from 'app/utils/uniqueID';

let prepareTemplate = (template) => {
  template.properties = template.properties.map((property) => {
    property.id = ID();
    return property;
  });

  return Immutable.fromJS(template);
};

export default class EditTemplate extends RouteHandler {

  static requestState({templateId}) {
    return Promise.all([
      templatesAPI.get(templateId),
      thesaurisAPI.get()
    ])
    .then((response) => {
      let templates = response[0];
      let thesauri = response[1];
      return {
        template: {
          data: prepareTemplate(templates[0]),
          uiState: Immutable.fromJS({thesauri: thesauri})
        }
      };
    });
  }

  setReduxState({template}) {
    this.context.store.dispatch(setTemplate(template.data));
    this.context.store.dispatch(setThesauri(template.uiState.toJS().thesauri));
  }

  render() {
    return <TemplateCreator />;
  }

}

//when all components are integrated with redux we can remove this
EditTemplate.__redux = true;
