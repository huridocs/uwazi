import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import entitiesAPI from './EntitiesAPI';
import {actions} from 'app/BasicReducer';
import EntityViewer from './components/EntityViewer';
import referencesAPI from 'app/Viewer/referencesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import {actions as formActions} from 'react-redux-form';
import * as uiActions from './actions/uiActions';

import {get as prioritySortingCriteria} from 'app/utils/prioritySortingCriteria';

export default class Entity extends RouteHandler {

  static requestState({entityId, lang}, query, globalResources) {
    return Promise.all([
      entitiesAPI.get(entityId),
      referencesAPI.getGroupedByConnection(entityId),
      relationTypesAPI.get()
    ])
    .then(([entities, referenceGroups, relationTypes]) => {
      const filteredTemplates = referenceGroups.reduce((templateIds, group) => {
        return templateIds.concat(group.templates.map(t => t._id.toString()));
      }, []);

      const sortOptions = prioritySortingCriteria({currentCriteria: {}, filteredTemplates, templates: globalResources.templates});

      return Promise.all([entities[0], referenceGroups, referencesAPI.search(entityId, sortOptions), relationTypes, sortOptions]);
    })
    .then(([entity, referenceGroups, searchResults, relationTypes, sort]) => {
      return {
        entityView: {
          entity,
          referenceGroups,
          searchResults,
          sort,
          filters: {}
        },
        relationTypes
      };
    });
  }

  componentWillMount() {
    this.context.store.dispatch(uiActions.showTab('info'));
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.context.store.dispatch(actions.unset('entityView/entity'));
    this.context.store.dispatch(actions.unset('entityView/referenceGroups'));
    this.context.store.dispatch(actions.unset('entityView/searchResults'));
    this.context.store.dispatch(actions.unset('entityView/filters'));
    this.context.store.dispatch(actions.unset('entityView.sort'));
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('relationTypes', state.relationTypes));
    this.context.store.dispatch(actions.set('entityView/entity', state.entityView.entity));
    this.context.store.dispatch(actions.set('entityView/referenceGroups', state.entityView.referenceGroups));
    this.context.store.dispatch(actions.set('entityView/searchResults', state.entityView.searchResults));
    this.context.store.dispatch(actions.set('entityView/filters', state.entityView.filters));
    this.context.store.dispatch(formActions.merge('entityView.sort', state.entityView.sort));
  }

  render() {
    return <EntityViewer/>;
  }
}
