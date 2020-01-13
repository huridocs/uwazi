/** @format */

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import Loader from 'app/components/Elements/Loader';
import * as entityActions from 'app/Entities/actions/actions';
import * as uiActions from 'app/Entities/actions/uiActions';
import OneUpEntityViewer from 'app/Review/components/OneUpEntityViewer';
import { setDocuments, unsetDocuments } from 'app/Library/actions/libraryActions';
import { wrapDispatch } from 'app/Multireducer';
import * as relationships from 'app/Relationships/utils/routeUtils';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import api from 'app/Search/SearchAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import { setReferences } from 'app/Viewer/actions/referencesActions';
import React from 'react';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import { processQuery } from 'app/Library/helpers/requestState';

class OneUpReview extends RouteHandler {
  static async requestState(requestParams, state) {
    const documentsRequest = {
      ...requestParams,
      data: {
        ...processQuery(requestParams.data, state),
        limit: 5000,
        select: ['sharedId'],
      },
    };
    const [templates, relationTypes, documents] = await Promise.all([
      TemplatesAPI.get(requestParams.onlyHeaders()),
      relationTypesAPI.get(requestParams.onlyHeaders()),
      api.search(documentsRequest),
    ]);

    if (!documents.rows.length) {
      // TODO(bdittes): Forward to /library.
      return [];
    }
    const firstSharedId = documents.rows[0].sharedId;

    return [
      dispatch => wrapDispatch(dispatch, 'library')(unsetDocuments()),
      actions.set('relationTypes', relationTypes),
      dispatch => wrapDispatch(dispatch, 'library')(setDocuments(documents)),
      actions.set('oneUpReview.state', {
        fullEdit: false,
        loadConnections: false,
        indexInDocs: 0,
        totalDocs: documents.rows.length,
      }),
      ...(await entityActions.getAndLoadEntity(firstSharedId, templates, state, false)),
    ];
  }

  componentWillUnmount() {
    this.emptyState();
  }

  componentWillMount() {
    this.context.store.dispatch(uiActions.showTab('info'));
  }

  componentDidMount() {}

  emptyState() {
    // TODO(bdittes): Empty library
    this.context.store.dispatch(actions.unset('viewer/doc'));
    this.context.store.dispatch(actions.unset('viewer/templates'));
    this.context.store.dispatch(actions.unset('viewer/thesauris'));
    this.context.store.dispatch(actions.unset('viewer/relationTypes'));
    this.context.store.dispatch(actions.unset('viewer/rawText'));
    this.context.store.dispatch(formActions.reset('documentViewer.tocForm'));
    this.context.store.dispatch(actions.unset('viewer/targetDoc'));
    this.context.store.dispatch(setReferences([]));
    this.context.store.dispatch(actions.unset('entityView/entity'));
    this.context.store.dispatch(relationships.emptyState());
  }

  render() {
    const { entity } = this.props;
    if (!entity.get('_id')) {
      return <Loader />;
    }
    return <OneUpEntityViewer {...this.props} />;
  }
}

const mapStateToProps = state => {
  const entity = state.documentViewer.doc.get('_id')
    ? state.documentViewer.doc
    : state.entityView.entity;
  return {
    entity,
  };
};

export default connect(mapStateToProps)(OneUpReview);
