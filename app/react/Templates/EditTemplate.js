import React, {PropTypes} from 'react';
import Immutable from 'immutable';

import templatesAPI from '~/Templates/TemplatesAPI';
import thesaurisAPI from '~/Thesauris/ThesaurisAPI';
import TemplateCreator from '~/Templates/components/TemplateCreator';
import {setTemplate} from '~/Templates/actions/templateActions';
import {setThesauri} from '~/Templates/actions/uiActions';
import RouteHandler from '~/controllers/App/RouteHandler';
import ID from '~/utils/uniqueID';

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

EditTemplate.contextTypes = {
  store: PropTypes.object.isRequired
};

//when all components are integrated with redux we can remove this
EditTemplate.__redux = true;
