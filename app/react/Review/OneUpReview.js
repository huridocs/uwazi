/** @format */

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import Loader from 'app/components/Elements/Loader';
import * as uiActions from 'app/Entities/actions/uiActions';
import { setDocuments, unsetDocuments } from 'app/Library/actions/libraryActions';
import { processQuery } from 'app/Library/helpers/requestState';
import { wrapDispatch } from 'app/Multireducer';
import * as relationships from 'app/Relationships/utils/routeUtils';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import * as reviewActions from 'app/Review/actions/actions';
import OneUpEntityViewer from 'app/Review/components/OneUpEntityViewer';
import api from 'app/Search/SearchAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import { setReferences } from 'app/Viewer/actions/referencesActions';
import React from 'react';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import { propertyTypes } from 'shared/propertyTypes';

function buildInitialOneUpState(documentsRequest, documents, thesauri, templates) {
  const thesaurusValues = [];
  const thesauriKeys = Object.keys(documentsRequest.data.filters || {}).reduce((res, k) => {
    const propName = k[0] === '_' ? k.substring(1) : k;
    if (k[0] === '_') {
      thesaurusValues.push(
        ...documentsRequest.data.filters[k].values.filter(v => v && !['any', 'missing'].includes(v))
      );
    }
    return {
      ...res,
      ...templates.reduce((res2, tmpl) => {
        const prop = tmpl.properties.find(p => p.name === propName);
        if (!prop || ![propertyTypes.select, propertyTypes.multiselect].includes(prop.type)) {
          return res2;
        }
        return { ...res2, [prop.content]: true };
      }, {}),
    };
  }, {});
  const thesaurus =
    Object.keys(thesauriKeys).length === 1
      ? thesauri.find(t => t._id.toString() === Object.keys(thesauriKeys)[0])
      : null;
  thesauri.forEach(t => {
    t.values.forEach(tv => {
      const i = thesaurusValues.findIndex(v => v === tv.id);
      if (i >= 0) {
        thesaurusValues[i] = tv.label;
      }
    });
  });
  return {
    loaded: true,
    fullEdit: false,
    loadConnections: false,
    indexInDocs: 0,
    totalDocs: documents.rows.length,
    maxTotalDocs: 5001,
    requestHeaders: documentsRequest.headers,
    reviewThesaurusName: thesaurus ? thesaurus.name : '',
    reviewThesaurusId: thesaurus ? thesaurus._id.toString() : '',
    reviewThesaurusValues: thesaurusValues,
  };
}

export class OneUpReviewBase extends RouteHandler {
  static async requestState(requestParams, state) {
    const documentsRequest = requestParams.set({
      ...processQuery(requestParams.data, state),
      limit: 5001,
      select: ['sharedId'],
      unpublished: !!requestParams.data.unpublished,
      includeUnpublished: !!requestParams.data.includeUnpublished,
    });
    const [templates, thesauri, relationTypes, documents] = await Promise.all([
      TemplatesAPI.get(requestParams.onlyHeaders()),
      ThesaurisAPI.getThesauri(requestParams.onlyHeaders()),
      relationTypesAPI.get(requestParams.onlyHeaders()),
      api.search(documentsRequest),
    ]);

    const firstSharedId = documents.rows.length ? documents.rows[0].sharedId : '';

    return [
      actions.set('relationTypes', relationTypes),
      dispatch => wrapDispatch(dispatch, 'library')(unsetDocuments()),
      dispatch => wrapDispatch(dispatch, 'library')(setDocuments(documents)),
      actions.set(
        'oneUpReview.state',
        buildInitialOneUpState(documentsRequest, documents, thesauri, templates)
      ),
      ...(firstSharedId
        ? await reviewActions.getAndLoadEntity(
            requestParams.set({ sharedId: firstSharedId }),
            templates,
            state,
            false
          )
        : []),
    ];
  }

  urlHasChanged(nextProps) {
    return nextProps.location.query.q !== this.props.location.query.q;
  }

  componentWillUnmount() {
    this.emptyState();
  }

  componentWillMount() {
    this.context.store.dispatch(uiActions.showTab('info'));
  }

  componentDidMount() {}

  emptyState() {
    wrapDispatch(this.context.store.dispatch, 'library')(unsetDocuments());
    this.context.store.dispatch(setReferences([]));
    this.context.store.dispatch(actions.unset('entityView/entity'));
    this.context.store.dispatch(formActions.reset('entityView.entityForm'));
    this.context.store.dispatch(relationships.emptyState());
    actions.set('oneUpReview.state', {});
  }

  render() {
    const { entity, oneUpState } = this.props;
    if (
      !oneUpState ||
      !oneUpState.get('loaded') ||
      (oneUpState.get('totalDocs') && (!entity || !entity.get('_id')))
    ) {
      return <Loader />;
    }
    return <OneUpEntityViewer />;
  }
}

export default connect(state => ({
  entity: state.entityView.entity,
  oneUpState: state.oneUpReview.state,
}))(OneUpReviewBase);
