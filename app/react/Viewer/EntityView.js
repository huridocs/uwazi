import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { actions } from 'app/BasicReducer';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import * as relationships from 'app/Relationships/utils/routeUtils';

import { getPageAssets } from 'app/Pages/utils/getPageAssets';

import { notificationActions } from 'app/Notifications';
import EntityViewer from '../Entities/components/EntityViewer';
import entitiesAPI from '../Entities/EntitiesAPI';
import { prepareAssets } from './pageAssets';

class Entity extends Component {
  static async requestState(requestParams, state) {
    const requestStateStart = performance.now();

    const entityStart = performance.now();
    const relationTypesStart = performance.now();
    const relationshipsStart = performance.now();

    const [[entity], relationTypes, [connectionsGroups, searchResults, sort, filters]] =
      await Promise.all([
        entitiesAPI.get(requestParams.set({ sharedId: requestParams.data.sharedId })).then(r => {
          console.log(
            '[PERF][EntityView] entitiesAPI.get():',
            (performance.now() - entityStart).toFixed(2),
            'ms'
          );
          return r;
        }),
        relationTypesAPI.get(requestParams.onlyHeaders()).then(r => {
          console.log(
            '[PERF][EntityView] relationTypesAPI.get():',
            (performance.now() - relationTypesStart).toFixed(2),
            'ms'
          );
          return r;
        }),
        relationships.requestState(requestParams, state).then(r => {
          console.log(
            '[PERF][EntityView] relationships.requestState():',
            (performance.now() - relationshipsStart).toFixed(2),
            'ms'
          );
          return r;
        }),
      ]);

    const templateStart = performance.now();
    const entityTemplate = state.templates.find(t => t.get('_id') === entity.template);
    console.log(
      '[PERF][EntityView] Template lookup:',
      (performance.now() - templateStart).toFixed(2),
      'ms'
    );

    const pageActions = [];
    if (entityTemplate.get('entityViewPage')) {
      const assetsStart = performance.now();
      const assets = prepareAssets(entity, entityTemplate, state, relationTypes);
      console.log(
        '[PERF][EntityView] prepareAssets():',
        (performance.now() - assetsStart).toFixed(2),
        'ms'
      );

      const pageAssetsStart = performance.now();
      const { pageView, itemLists, datasets, errors } = await getPageAssets(
        requestParams.set({ sharedId: entityTemplate.get('entityViewPage') }),
        undefined,
        {
          ...assets,
        }
      );
      console.log(
        '[PERF][EntityView] getPageAssets():',
        (performance.now() - pageAssetsStart).toFixed(2),
        'ms'
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

    console.log(
      '[PERF][EntityView] TOTAL requestState:',
      (performance.now() - requestStateStart).toFixed(2),
      'ms'
    );

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
    this.context.store.dispatch(actions.unset('page/pageView'));
    this.context.store.dispatch(actions.unset('page/itemLists'));
    this.context.store.dispatch(actions.unset('page/datasets'));
  }

  render() {
    return <EntityViewer {...this.props} />;
  }
}

Entity.contextTypes = {
  store: PropTypes.object,
};

export default Entity;
