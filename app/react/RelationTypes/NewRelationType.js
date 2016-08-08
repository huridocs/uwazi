import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import RelationTypeForm from 'app/RelationTypes/components/RelationTypeForm';
import {actions} from 'app/BasicReducer';
import api from 'app/RelationTypes/RelationTypesAPI';

export default class NewRelationType extends RouteHandler {

  static requestState() {
    return api.get()
    .then((relationTypes) => {
      return {relationTypes};
    });
  }

  setReduxState({relationTypes}) {
    this.context.store.dispatch(actions.set('relationTypes', relationTypes));
  }

  render() {
    return <RelationTypeForm />;
  }
}
