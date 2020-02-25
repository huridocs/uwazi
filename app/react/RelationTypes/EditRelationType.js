import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { editRelationType } from 'app/RelationTypes/actions/relationTypesActions';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import TemplateCreator from '../Templates/components/TemplateCreator';

export default class EditRelationType extends RouteHandler {
  static async requestState(requestParams) {
    const [relationType] = await relationTypesAPI.get(requestParams);
    relationType.properties = relationType.properties || [];

    return [editRelationType(relationType)];
  }

  render() {
    return <TemplateCreator relationType />;
  }
}
