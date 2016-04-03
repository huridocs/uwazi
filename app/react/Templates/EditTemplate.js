import React, {PropTypes} from 'react';
import Immutable from 'immutable';

import api from '~/Templates/TemplatesAPI';
import TemplateCreator from '~/Templates/components/TemplateCreator';
import {setTemplate} from '~/Templates/actions/templateActions';
import RouteHandler from '~/controllers/App/RouteHandler';

export default class EditTemplate extends RouteHandler {

  static requestState({templateId}) {
    return api.get(templateId)
    .then((templates) => {
      let template = templates[0];
      template.properties = template.properties.map((property) => {
        property.id = Math.random().toString(36).substr(2);
        return property;
      });
      return {template: {data: Immutable.fromJS(template)}};
    });
  }

  setReduxState({template}) {
    this.context.store.dispatch(setTemplate(template.data));
  }

  render() {
    return <TemplateCreator />;
  }

}

//when all components are integrated with redux we can remove this
EditTemplate.__redux = true;
