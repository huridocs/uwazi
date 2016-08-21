import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveEntity} from 'app/Library/actions/libraryActions';
import {actions, MetadataForm} from 'app/Metadata';

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
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit: saveEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
