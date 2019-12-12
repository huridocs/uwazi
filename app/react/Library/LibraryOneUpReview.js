/** @format */

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import Loader from 'app/components/Elements/Loader';
import EntityViewer from 'app/Entities/components/EntityViewer';
import entitiesAPI from 'app/Entities/EntitiesAPI';
import { setDocuments, unsetDocuments } from 'app/Library/actions/libraryActions';
import * as metadataActions from 'app/Metadata/actions/actions';
import { wrapDispatch } from 'app/Multireducer';
import * as relationships from 'app/Relationships/utils/routeUtils';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import api from 'app/Search/SearchAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import { advancedSort } from 'app/utils/advancedSort';
import { setReferences } from 'app/Viewer/actions/referencesActions';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { processQuery } from './helpers/requestState';
import { RequestParams } from 'app/utils/RequestParams';

function loadEntity(entity, templates) {
  const form = 'entityView.entityForm';
  const sortedTemplates = advancedSort(templates, { property: 'name' });
  const defaultTemplate = sortedTemplates.find(t => t.default);
  const template = entity.template || defaultTemplate._id;
  const templateconfig = sortedTemplates.find(t => t._id === template);

  const _metadata = metadataActions.resetMetadata(
    entity.metadata || {},
    templateconfig,
    { resetExisting: false },
    templateconfig
  );
  const metadata = metadataActions.UnwrapMetadataObject(_metadata, templateconfig);
  return [
    formActions.reset(form),
    formActions.load(form, { ...entity, metadata, template }),
    formActions.setPristine(form),
  ];
}

function nextEntity() {
  return async (dispatch, getState) => {
    const state = getState();
    const current = state.entityView.entity.sharedId;
    const index = state.documents.rows.findIndex(e => e.sharedId === current) + 1;
    const { sharedId } = state.documents.rows[index];
    const [[entity], [connectionsGroups, searchResults, sort, filters]] = await Promise.all([
      entitiesAPI.get(new RequestParams({ sharedId })),
      relationships.requestState(new RequestParams({ sharedId }), state),
    ]);

    [
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
      ...loadEntity(entity, state.templates),
    ].forEach(action => {
      dispatch(action);
    });
  };
}

class LibraryOneUpReview extends RouteHandler {
  static async requestState(requestParams, state) {
    const documentsRequest = {
      ...requestParams,
      data: {
        ...processQuery(requestParams.data, state),
        limit: 10000,
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
    const currentSharedId = documents.rows[0].sharedId;

    const [[entity], [connectionsGroups, searchResults, sort, filters]] = await Promise.all([
      entitiesAPI.get(requestParams.set({ sharedId: currentSharedId })),
      relationships.requestState(requestParams.set({ sharedId: currentSharedId }), state),
    ]);

    return [
      unsetDocuments(),
      actions.set('relationTypes', relationTypes),
      setDocuments(documents),
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
      ...loadEntity(entity, templates),
    ];
  }

  componentWillUnmount() {
    this.emptyState();
  }

  componentWillMount() {}

  componentDidMount() {}

  emptyState() {
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
    return <EntityViewer {...this.props} />;
  }
}

LibraryOneUpReview.defaultProps = {
  params: {},
};

LibraryOneUpReview.contextTypes = {
  store: PropTypes.object,
};

const mapStateToProps = state => {
  const entity = state.documentViewer.doc.get('_id')
    ? state.documentViewer.doc
    : state.entityView.entity;
  return {
    entity,
    rawEntity: state.entityView.entity,
    templates: state.templates,
  };
};

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      nextEntity,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LibraryOneUpReview);
