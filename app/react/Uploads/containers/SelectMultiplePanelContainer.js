import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {unselectAllDocuments, updateSelectedEntities, updateEntities} from 'app/Uploads/actions/uploadsActions';
import {SelectMultiplePanel} from 'app/Metadata';

function mapStateToProps(state) {
  return {
    formKey: 'uploads.multipleEdit',
    state: state.uploads.multipleEdit,
    formState: state.uploads.multipleEditForm,
    templates: state.templates,
    entitiesSelected: state.uploads.uiState.get('selectedDocuments'),
    thesauris: state.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({unselectAllDocuments, updateSelectedEntities, updateEntities}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectMultiplePanel);
