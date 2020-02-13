/** @format */

import { actions } from 'app/BasicReducer';
import api from 'app/Entities/EntitiesAPI';
import entitiesUtil from 'app/Entities/utils/filterBaseProperties';
import { wrapEntityMetadata } from 'app/Metadata';
import { loadFetchedInReduxForm } from 'app/Metadata/actions/actions';
import * as relationships from 'app/Relationships/utils/routeUtils';
import { RequestParams } from 'app/utils/RequestParams';
import Immutable from 'immutable';
import { Action, Dispatch } from 'redux';
import { TemplateSchema } from 'shared/types/templateType';
import { StoreState, OneUpState } from '../common';
import { browserHistory } from 'react-router';

export async function getAndLoadEntity(
  requestParams: RequestParams,
  templates: TemplateSchema[],
  state: StoreState,
  loadConnections: boolean
) {
  const [[entity], [connectionsGroups, searchResults, sort, filters]] = await Promise.all([
    api.get(requestParams),
    loadConnections
      ? relationships.requestState(requestParams, state)
      : [[], { rows: [] }, {}, Immutable.fromJS({})],
  ]);

  return [
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
    ...loadFetchedInReduxForm('entityView.entityForm', entity, templates),
  ];
}

export function toggleOneUpFullEdit() {
  return async (dispatch: Dispatch<StoreState>, getState: () => StoreState) => {
    const state = getState();
    const oneUpState = state.oneUpReview.state?.toJS();
    if (oneUpState && oneUpState.fullEdit && !state.entityView.entityFormState.$form.pristine) {
      const entity = await api.denormalize(
        new RequestParams(
          wrapEntityMetadata(entitiesUtil.filterBaseProperties(state.entityView.entityForm))
        )
      );
      dispatch(actions.set('entityView/entity', entity));
    }
    dispatch(
      actions.set('oneUpReview.state', {
        ...oneUpState,
        fullEdit: oneUpState ? !oneUpState.fullEdit : false,
      })
    );
  };
}

async function switchToEntity(
  dispatch: Dispatch<StoreState>,
  index: number,
  state: StoreState,
  oneUpState: OneUpState
) {
  const sharedId =
    index < oneUpState.totalDocs
      ? state.library.documents
          .get('rows')
          .get(index)
          .get('sharedId')
      : '';

  [
    ...(sharedId
      ? await getAndLoadEntity(
          new RequestParams({ sharedId }, oneUpState.requestHeaders),
          state.templates.toJS(),
          state,
          oneUpState.loadConnections
        )
      : []),
    actions.set('oneUpReview.state', {
      ...oneUpState,
      indexInDocs: index,
    }),
  ].forEach(action => {
    dispatch(action as Action);
  });
}

export function reviewAndPublish(refName: string) {
  browserHistory.push(
    `/uploads/?q=(filters:(_${refName}:(values:!(any)),${refName}:(values:!(any))),` +
      'limit:100,order:desc,sort:creationDate)&view=nosearch'
  );
}

export function switchOneUpEntity(delta: number, save: boolean) {
  return async (dispatch: Dispatch<StoreState>, getState: () => StoreState) => {
    const state = getState();
    const oneUpState = state.oneUpReview.state?.toJS();
    if (!oneUpState) {
      return;
    }
    if (save) {
      const entity = wrapEntityMetadata(
        entitiesUtil.filterBaseProperties(state.entityView.entityForm)
      );
      await api.save(new RequestParams(entity, oneUpState.requestHeaders));
    }
    const current = state.entityView.entity.get('sharedId');
    const index = Math.max(
      0,
      Math.min(
        state.library.documents.get('rows').findIndex(e => e.get('sharedId') === current) + delta,
        oneUpState.totalDocs - 1
      )
    );
    await switchToEntity(dispatch, index, state, oneUpState);
  };
}

export function toggleOneUpLoadConnections() {
  return async (dispatch: Dispatch<StoreState>, getState: () => StoreState) => {
    const state = getState();
    const oneUpState = state.oneUpReview.state?.toJS();
    if (!oneUpState) {
      return;
    }
    dispatch(
      actions.set('oneUpReview.state', {
        ...oneUpState,
        loadConnections: !oneUpState.loadConnections,
      })
    );
    await dispatch(switchOneUpEntity(0, false));
  };
}
