/** @format */

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import Loader from 'app/components/Elements/Loader';
import EntityViewer from 'app/Entities/components/EntityViewer';
import entitiesAPI from 'app/Entities/EntitiesAPI';
import * as relationships from 'app/Relationships/utils/routeUtils';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { setReferences } from 'app/Viewer/actions/referencesActions';
import PropTypes from 'prop-types';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import { wrapDispatch } from 'app/Multireducer';
import * as metadataActions from 'app/Metadata/actions/actions';
import { advancedSort } from 'app/utils/advancedSort';
import TemplatesAPI from 'app/Templates/TemplatesAPI';

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

class LibraryOneUpReview extends RouteHandler {
  static async requestState(requestParams, state) {
    const [
      templates,
      [entity],
      relationTypes,
      [connectionsGroups, searchResults, sort, filters],
    ] = await Promise.all([
      TemplatesAPI.get(requestParams.onlyHeaders()),
      entitiesAPI.get(requestParams.set({ sharedId: 'cd8a7h760zo' })),
      relationTypesAPI.get(requestParams.onlyHeaders()),
      relationships.requestState(requestParams.set({ sharedId: 'cd8a7h760zo' }), state),
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
      ...loadEntity(entity, templates),
    ];
  }

  componentWillUnmount() {
    this.emptyState();
  }

  componentWillMount() {
    // this.props.loadInReduxForm(
    //   'entityView.entityForm',
    //   { ...this.props.rawEntity.toJS(), sharedId: undefined },
    //   this.props.templates.toJS()
    // );
    // this.context.store.dispatch(uiActions.showTab('info'));
  }

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
      loadInReduxForm: metadataActions.loadInReduxForm,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LibraryOneUpReview);
