import React from 'react';

import RouteHandler from 'app/controllers/App/RouteHandler';
import RelationTypeForm from 'app/RelationTypes/components/RelationTypeForm';
import {editRelationType} from 'app/RelationTypes/actions/relationTypesActions';
import api from 'app/RelationTypes/RelationTypesAPI';

export default class EditRelationType extends RouteHandler {

  static requestState({relationTypeId}) {
    return api.get(relationTypeId)
    .then((relationType) => {
      return {relationType: relationType};
    });
  }

  setReduxState({relationType}) {
    this.context.store.dispatch(editRelationType(relationType));
  }

  render() {
    return <RelationTypeForm />;
  }
}

//when all components are integrated with redux we can remove this
EditRelationType.__redux = true;
