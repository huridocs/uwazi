import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import entitiesAPI from './EntitiesAPI';
import {actions} from 'app/BasicReducer';
import EntityViewer from './components/EntityViewer';
import referencesAPI from 'app/Viewer/referencesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import {actions as formActions} from 'react-redux-form';

import {get as prioritySortingCriteria} from 'app/utils/prioritySortingCriteria';

export default class Entity extends RouteHandler {

  static requestState({entityId, lang}, query, globalResources) {
    // Sorting requires the refs, check if this is the most useful approach.
    // console.log(globalResources);
    // ------
    return Promise.all([
      entitiesAPI.get(entityId),
      referencesAPI.getGroupedByConnection(entityId),
      relationTypesAPI.get()
    ])
    .then(([entities, referenceGroups, relationTypes]) => {
      return {
        entityView: {
          entity: entities[0],
          referenceGroups: referenceGroups,
          sort: prioritySortingCriteria(
            // {
            //   currentCriteria: {},
            //   filteredTemplates: relevantReferences.map(r => r.connectedDocumentTemplate),
            //   templates: globalResources.templates
            // }
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
    this.context.store.dispatch(actions.unset('entityView/referenceGroups'));
  }

  // TEST!
  setReduxState(state) {
    this.context.store.dispatch(actions.set('relationTypes', state.relationTypes));
    this.context.store.dispatch(actions.set('entityView/entity', state.entityView.entity));
    this.context.store.dispatch(actions.set('entityView/referenceGroups', state.entityView.referenceGroups));
    this.context.store.dispatch(formActions.merge('entityView.sort', state.entityView.sort));
  }
  // ---

  render() {
    return <EntityViewer/>;
  }
}
