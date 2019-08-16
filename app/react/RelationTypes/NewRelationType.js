import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { editRelationType } from 'app/RelationTypes/actions/relationTypesActions';
import api from 'app/RelationTypes/RelationTypesAPI';
import TemplateCreator from '../Templates/components/TemplateCreator';

export default class NewRelationType extends RouteHandler {
  static async requestState(requestParams) {
    const relationTypes = await api.get(requestParams);

    return [
      actions.set('relationTypes', relationTypes),
      editRelationType({ name: '', properties: [] }),
    ];
  }

  render() {
    return <TemplateCreator relationType />;
  }
}
