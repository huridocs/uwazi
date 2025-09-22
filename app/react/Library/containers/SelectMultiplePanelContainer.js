import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from '../../Multireducer.js';

import {
  unselectAllDocuments,
  updateSelectedEntities,
  updateEntities,
  getAndSelectDocument,
} from '../../Library/actions/libraryActions.js';
import { SelectMultiplePanel } from '../../Metadata.js';

function mapStateToProps(state, props) {
  return {
    formKey: `${props.storeKey}.sidepanel.multipleEdit`,
    state: state[props.storeKey].sidepanel.multipleEdit,
    formState: state[props.storeKey].sidepanel.multipleEditForm,
    templates: state.templates,
    entitiesSelected: state[props.storeKey].ui.get('selectedDocuments'),
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
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectMultiplePanel);
