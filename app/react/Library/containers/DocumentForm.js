import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import documents from 'app/Documents';
import {saveDocument} from 'app/Library/actions/libraryActions';
import MetadataForm from 'app/Templates/components/MetadataForm';

function mapStateToProps({library}) {
  return {
    model: 'library.metadata',
    metadata: library.metadata,
    state: library.metadataForm,
    templates: library.filters.get('templates'),
    thesauris: library.filters.get('thesauris')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: documents.actions.changeTemplate, onSubmit: saveDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
