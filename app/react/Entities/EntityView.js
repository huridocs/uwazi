import React from 'react';

import { actions } from 'app/BasicReducer';
import RouteHandler from 'app/App/RouteHandler';
import SearchButton from 'app/Entities/components/SearchButton';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import * as relationships from 'app/Relationships/utils/routeUtils';

import EntityViewer from './components/EntityViewer';
import entitiesAPI from './EntitiesAPI';
import * as uiActions from './actions/uiActions';

export default class Entity extends RouteHandler {
  static async requestState(requestParams, state) {
    const [[entity], relationTypes, [connectionsGroups, searchResults, sort, filters]] =
      await Promise.all([
        entitiesAPI.get(requestParams.set({ sharedId: requestParams.data.sharedId })),
        relationTypesAPI.get(requestParams.onlyHeaders()),
        relationships.requestState(requestParams, state)
      ]);

    return [
      actions.set('relationTypes', relationTypes),
      actions.set('entityView/entity', entity),
      relationships.setReduxState({
        relationships: {
          list: {
            sharedId: entity.sharedId,
            entity,
            connectionsGroups,
            searchResults,
            sort,
            filters,
            view: 'graph'
          }
        }
      }),
    ];
  }

  componentWillMount() {
    this.context.store.dispatch(uiActions.showTab('info'));
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.context.store.dispatch(actions.unset('entityView/entity'));
    this.context.store.dispatch(relationships.emptyState());
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
