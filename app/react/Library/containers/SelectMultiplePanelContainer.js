import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {wrapDispatch} from 'app/Multireducer';

import {unselectAllDocuments, updateSelectedEntities, updateEntities} from 'app/Library/actions/libraryActions';
import {SelectMultiplePanel} from 'app/Metadata';

function mapStateToProps(state, props) {
  return {
    formKey: 'sidepanel.multipleEdit',
    state: state[props.storeKey].sidepanel.multipleEdit,
    formState: state[props.storeKey].sidepanel.multipleEditForm,
    templates: state.templates,
    entitiesSelected: state[props.storeKey].ui.get('selectedDocuments'),
    thesauris: state.thesauris
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({unselectAllDocuments, updateSelectedEntities, updateEntities}, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectMultiplePanel);
