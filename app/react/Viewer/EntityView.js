import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { actions } from 'app/BasicReducer';
import SearchButton from 'app/Entities/components/SearchButton';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import * as relationships from 'app/Relationships/utils/routeUtils';

import EntityViewer from '../Entities/components/EntityViewer';
import entitiesAPI from '../Entities/EntitiesAPI';
import * as uiActions from '../Entities/actions/uiActions';

export default class Entity extends Component {
  static async requestState(requestParams, state) {
    const [
      [entity],
      relationTypes,
      [connectionsGroups, searchResults, sort, filters],
    ] = await Promise.all([
      entitiesAPI.get(requestParams.set({ sharedId: requestParams.data.sharedId })),
      relationTypesAPI.get(requestParams.onlyHeaders()),
      relationships.requestState(requestParams, state),
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
            view: 'graph',
          },
        },
      }),
    ];
  }

  componentWillUnmount() {
    this.context.store.dispatch(uiActions.showTab('info'));
  }

  static renderTools() {
    return (
      <div className="searchBox">
        <SearchButton storeKey="library" />
      </div>
    );
  }

  render() {
    return <EntityViewer />;
  }
}

Entity.contextTypes = {
  store: PropTypes.object,
};
