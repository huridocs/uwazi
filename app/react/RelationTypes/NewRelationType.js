import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import {actions} from 'app/BasicReducer';
import {editRelationType} from 'app/RelationTypes/actions/relationTypesActions';
import api from 'app/RelationTypes/RelationTypesAPI';
import TemplateCreator from '../Templates/components/TemplateCreator';

export default class NewRelationType extends RouteHandler {

  static requestState() {
    return api.get()
    .then((relationTypes) => {
      return {relationTypes};
    });
  }

  setReduxState({relationTypes}) {
    this.context.store.dispatch(actions.set('relationTypes', relationTypes));
    this.context.store.dispatch(editRelationType({name: '', properties: []}));
  }

  render() {
    return <TemplateCreator relationType={true} />;
  }
}
