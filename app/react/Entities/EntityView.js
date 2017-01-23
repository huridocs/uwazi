import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import entitiesAPI from './EntitiesAPI';
import {actions} from 'app/BasicReducer';
import EntityViewer from './components/EntityViewer';
import referencesAPI from 'app/Viewer/referencesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import referencesUtils from 'app/Viewer/utils/referencesUtils';
import {actions as formActions} from 'react-redux-form';

import {get as prioritySortingCriteria} from 'app/utils/prioritySortingCriteria';

export default class Entity extends RouteHandler {

  static requestState({entityId, lang}, query, globalResources) {
    return Promise.all([
      entitiesAPI.get(entityId),
      referencesAPI.get(entityId),
      relationTypesAPI.get()
    ])
    .then(([entities, references, relationTypes]) => {
      const relevantReferences = referencesUtils.filterRelevant(references, lang);

      return {
        entityView: {
          entity: entities[0],
          references: relevantReferences,
          sort: prioritySortingCriteria(
            {
              currentCriteria: {},
              filteredTemplates: relevantReferences.map(r => r.connectedDocumentTemplate),
              templates: globalResources.templates
            }
          )
        },
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

  // TEST!
  setReduxState(state) {
    this.context.store.dispatch(actions.set('relationTypes', state.relationTypes));
    this.context.store.dispatch(actions.set('entityView/entity', state.entityView.entity));
    this.context.store.dispatch(actions.set('entityView/references', state.entityView.references));
    this.context.store.dispatch(formActions.merge('entityView.sort', state.entityView.sort));
  }
  // ---

  render() {
    return <EntityViewer/>;
  }
}
