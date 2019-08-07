import { actions as formActions } from 'react-redux-form';
import React from 'react';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { actions } from 'app/BasicReducer';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/App/RouteHandler';

export default class NewTemplate extends RouteHandler {
  static async requestState(requestParams) {
    const [thesauris, templates, relationTypes] = await Promise.all([
      thesaurisAPI.get(requestParams.onlyHeaders()),
      templatesAPI.get(requestParams.onlyHeaders()),
      relationTypesAPI.get(requestParams.onlyHeaders())
    ]);

    return [
      formActions.reset('template.data'),
      actions.set('thesauris', thesauris),
      actions.set('templates', templates),
      actions.set('relationTypes', relationTypes),
    ];
  }

  render() {
    return <TemplateCreator />;
  }
}
