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
import React from 'react';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { processQuery } from './helpers/requestState';
import { RequestParams } from 'app/utils/RequestParams';
import { wrapEntityMetadata } from 'app/Metadata/components/MetadataForm';

function loadEntity(entity, templates) {
  const form = 'entityView.entityForm';
  const sortedTemplates = advancedSort(templates, { property: 'name' });
  const defaultTemplate = sortedTemplates.find(t => t.default);
  const template = entity.template || defaultTemplate._id;
  const templateconfig = sortedTemplates.find(t => t._id === template);

  const metadata = metadataActions.UnwrapMetadataObject(
    metadataActions.resetMetadata(
      entity.metadata || {},
      templateconfig,
      { resetExisting: false },
      templateconfig
    ),
    templateconfig
  );
  const suggestedMetadata = metadataActions.UnwrapMetadataObject(
    metadataActions.resetMetadata(
      entity.suggestedMetadata || {},
      templateconfig,
      { resetExisting: false },
      templateconfig
    ),
    templateconfig
  );
  return [
    formActions.reset(form),
    formActions.load(form, { ...entity, metadata, suggestedMetadata, template }),
    formActions.setPristine(form),
  ];
}

async function getAndLoadEntity(sharedId, templates, state) {
  const [[entity], [connectionsGroups, searchResults, sort, filters]] = await Promise.all([
    entitiesAPI.get(new RequestParams({ sharedId })),
    relationships.requestState(new RequestParams({ sharedId }), state),
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
    ...loadEntity(entity, templates),
  ];
}

function oneUpSwitcher(delta, save) {
  return async (dispatch, getState) => {
    const state = getState();
    if (save) {
      const entity = wrapEntityMetadata(state.entityView.entityForm);
      await entitiesAPI.save(new RequestParams(entity));
    }

    const templates = state.templates.toJS();
    const current = state.entityView.entity.get('sharedId');
    const index =
      state.library.documents.get('rows').findIndex(e => e.get('sharedId') === current) + delta;
    const sharedId = state.library.documents
      .get('rows')
      .get(index)
      .get('sharedId');

    (await getAndLoadEntity(sharedId, templates, state)).forEach(action => {
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
    const firstSharedId = documents.rows[0].sharedId;

    return [
      dispatch => wrapDispatch(dispatch, 'library')(unsetDocuments()),
      actions.set('relationTypes', relationTypes),
      dispatch => wrapDispatch(dispatch, 'library')(setDocuments(documents)),
      ...(await getAndLoadEntity(firstSharedId, templates, state)),
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
    return <EntityViewer {...this.props} oneUpMode />;
  }
}

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
      oneUpSwitcher,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LibraryOneUpReview);
