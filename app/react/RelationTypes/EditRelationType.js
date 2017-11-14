import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import {editRelationType} from 'app/RelationTypes/actions/relationTypesActions';
import api from 'app/RelationTypes/RelationTypesAPI';
import TemplateCreator from '../Templates/components/TemplateCreator';

export default class EditRelationType extends RouteHandler {

  static requestState({relationTypeId}) {
    return api.get(relationTypeId)
    .then(([relationType]) => {
      if (!relationType.properties) {
        relationType.properties = [];
      }
      return {relationType: relationType};
    });
  }

  setReduxState({relationType}) {
    this.context.store.dispatch(editRelationType(relationType));
  }

  render() {
    return <TemplateCreator relationType={true} />;
  }
}
