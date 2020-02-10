/** @format */

import { actions as formActions } from 'react-redux-form';
import React from 'react';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesauriAPI from 'app/Thesauri/ThesauriAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { actions } from 'app/BasicReducer';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/App/RouteHandler';

export default class NewTemplate extends RouteHandler {
  static async requestState(requestParams) {
    const [thesauri, templates, relationTypes] = await Promise.all([
      thesauriAPI.get(requestParams.onlyHeaders()),
      templatesAPI.get(requestParams.onlyHeaders()),
      relationTypesAPI.get(requestParams.onlyHeaders()),
    ]);

    return [
      formActions.reset('template.data'),
      actions.set('thesauris', thesauri),
      actions.set('templates', templates),
      actions.set('relationTypes', relationTypes),
    ];
  }

  render() {
    return <TemplateCreator />;
  }
}
