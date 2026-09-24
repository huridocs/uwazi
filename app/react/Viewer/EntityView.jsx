import React from 'react';
import { ReduxStoreComponent } from '#app/App/reduxStoreComponent.js';

import { actions } from '#app/BasicReducer/index.js';
import relationTypesAPI from '#app/RelationTypes/RelationTypesAPI.js';
import * as relationships from '#app/Relationships/utils/routeUtils.js';

import { getPageAssets } from '#app/Pages/utils/getPageAssets.js';

import { notificationActions } from '#app/Notifications/index.js';
import { EntityViewerConnected as EntityViewer } from '../Entities/components/EntityViewer.js';
import { EntitiesAPI as entitiesAPI } from '../Entities/EntitiesAPI.js';
import { prepareAssets } from './pageAssets.js';

class Entity extends ReduxStoreComponent {
  static async requestState(requestParams, state) {
    const [[entity], relationTypes, [connectionsGroups, searchResults, sort, filters]] =
      await Promise.all([
        entitiesAPI.get(
          requestParams.set({
            sharedId: requestParams.data.sharedId,
            includeMetadataRelationships: true,
          })
        ),
        relationTypesAPI.get(requestParams.onlyHeaders()),
        relationships.requestState(requestParams, state),
      ]);

    const entityTemplate = state.templates.find(t => t.get('_id') === entity.template);

    const pageActions = [];
    if (entityTemplate.get('entityViewPage')) {
      const assets = prepareAssets(entity, entityTemplate, state, relationTypes);
      const { pageView, itemLists, datasets, errors } = await getPageAssets(
        requestParams.set({ sharedId: entityTemplate.get('entityViewPage') }),
        undefined,
        {
          ...assets,
        }
      );

      pageActions.push(
        actions.set('page/pageView', pageView),
        actions.set('page/itemLists', itemLists),
        actions.set('page/datasets', datasets)
      );
      if (errors && state.user.get('_id')) {
        pageActions.push(notificationActions.notify(errors, 'warning'));
      }
    }

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
    ].concat(pageActions);
  }

  componentWillUnmount() {
    this.store.dispatch(actions.unset('page/pageView'));
    this.store.dispatch(actions.unset('page/itemLists'));
    this.store.dispatch(actions.unset('page/datasets'));
  }

  render() {
    return <EntityViewer {...this.props} />;
  }
}

export { Entity, Entity as EntityView };
