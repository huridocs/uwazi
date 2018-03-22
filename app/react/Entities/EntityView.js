import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import entitiesAPI from './EntitiesAPI';
import {actions} from 'app/BasicReducer';
import EntityViewer from './components/EntityViewer';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import * as uiActions from './actions/uiActions';

import SearchButton from 'app/Entities/components/SearchButton';

import * as relationships from 'app/Relationships/utils/routeUtils';

export default class Entity extends RouteHandler {
  static requestState({entityId, lang}, query, state) {
    return Promise.all([
      entitiesAPI.get(entityId),
      relationTypesAPI.get(),
      relationships.requestState(entityId, state)
    ])
    .then(([entities, relationTypes, [connectionsGroups, searchResults, sort, filters]]) => {
      const entity = entities[0];
      return {
        entityView: {
          entity
        },
        relationships: {
          list: {
            entityId: entity.sharedId,
            entity,
            connectionsGroups,
            searchResults,
            sort,
            filters,
            view: 'graph'
          }
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
    // TEST!!!
    this.context.store.dispatch(relationships.emptyState());
    // -------
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('relationTypes', state.relationTypes));
    this.context.store.dispatch(actions.set('entityView/entity', state.entityView.entity));
    this.context.store.dispatch(relationships.setReduxState(state));
  }

  static renderTools() {
    return (
      <div className="searchBox">
        <SearchButton storeKey="library"/>
      </div>
    );
  }

  render() {
    return <EntityViewer/>;
  }
}
