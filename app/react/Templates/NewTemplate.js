import React from 'react';

import thesauriAPI from 'app/Thesauri/ThesauriAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { actions } from 'app/BasicReducer';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/App/RouteHandler';

export default class NewTemplate extends RouteHandler {
  static async requestState(requestParams) {
    const [thesauri, relationTypes] = await Promise.all([
      thesauriAPI.get(requestParams.onlyHeaders()),
      relationTypesAPI.get(requestParams.onlyHeaders()),
    ]);

    return [actions.set('thesauris', thesauri), actions.set('relationTypes', relationTypes)];
  }

  render() {
    return (
      <div className="settings-content sm-footer-extra-row">
        <TemplateCreator />
      </div>
    );
  }
}
