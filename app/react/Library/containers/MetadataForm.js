import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import documents from 'app/Documents';
import {MetadataForm} from 'app/Forms';

function mapStateToProps({library}) {
  return {
    model: 'library.metadataForm',
    metadata: library.metadataForm,
    state: library.metadataFormState,
    templates: library.filters.get('templates'),
    thesauris: library.filters.get('thesauris')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: documents.actions.changeTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
