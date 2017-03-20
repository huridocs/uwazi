import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {unselectAllDocuments, updateSelectedEntities, updateEntities} from 'app/Library/actions/libraryActions';
import {SelectMultiplePanel} from 'app/Metadata';

function mapStateToProps(state) {
  return {
    formKey: 'library.sidepanel.multipleEdit',
    state: state.library.sidepanel.multipleEdit,
    formState: state.library.sidepanel.multipleEditForm,
    templates: state.templates,
    entitiesSelected: state.library.ui.get('selectedDocuments'),
    thesauris: state.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({unselectAllDocuments, updateSelectedEntities, updateEntities}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectMultiplePanel);
