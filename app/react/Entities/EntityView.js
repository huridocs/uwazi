import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import entitiesAPI from './EntitiesAPI';
import {actions} from 'app/BasicReducer';
import EntityViewer from './components/EntityViewer';
import referencesAPI from 'app/Viewer/referencesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import referencesUtils from 'app/Viewer/utils/referencesUtils';

export default class Entity extends RouteHandler {

  static requestState({entityId, lang}) {
    return Promise.all([
      entitiesAPI.get(entityId),
      referencesAPI.get(entityId),
      relationTypesAPI.get()])
    .then(([entities, references, relationTypes]) => {
      return {
        entityView: {entity: entities[0], references: referencesUtils.filterRelevant(references, lang)},
        relationTypes
      };
    });
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.context.store.dispatch(actions.unset('entityView/entity'));
    this.context.store.dispatch(actions.unset('entityView/references'));
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('relationTypes', state.relationTypes));
    this.context.store.dispatch(actions.set('entityView/entity', state.entityView.entity));
    this.context.store.dispatch(actions.set('entityView/references', state.entityView.references));
  }

  render() {
    return <EntityViewer/>;
  }
}
