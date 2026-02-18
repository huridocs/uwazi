import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable from 'immutable';
import { wrapDispatch } from '#app/Multireducer/index.js';

import {
  unselectAllDocuments,
  updateSelectedEntities,
  updateEntities,
  getAndSelectDocument,
} from '#app/Library/actions/libraryActions.js';
import { SelectMultiplePanel } from '#app/Metadata/index.js';
import * as metadataActions from '#app/Metadata/actions/actions.js';
import { deleteEntities } from '#app/Entities/actions/actions.js';
import { AppMainContext } from '#app/App/AppMainContext.js';

function mapStateToProps(state, props) {
  const store = state[props.storeKey] || {};
  return {
    formKey: `${props.storeKey}.sidepanel.multipleEdit`,
    state: store.sidepanel?.multipleEdit,
    formState: store.sidepanel?.multipleEditForm || {},
    templates: state.templates,
    entitiesSelected:
      (store.ui && typeof store.ui.get === 'function' ? store.ui.get('selectedDocuments') : null) ||
      Immutable.List(),
    thesauris: state.thesauris,
    storeKey: props.storeKey,
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      unselectAllDocuments,
      updateSelectedEntities,
      updateEntities,
      getAndSelectDocument,
      deleteEntities,
      loadForm: metadataActions.loadTemplate,
      resetForm: metadataActions.resetReduxForm,
      multipleUpdate: metadataActions.multipleUpdate,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

const SelectMultiplePanelConnected = connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectMultiplePanel);

const SelectMultiplePanelWithContext = props => {
  const mainContext = useContext(AppMainContext);
  return React.createElement(SelectMultiplePanelConnected, { ...props, mainContext });
};

export { SelectMultiplePanelWithContext as SelectMultiplePanelContainer };
