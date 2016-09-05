import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveDocument} from 'app/Library/actions/libraryActions';
import {actions, MetadataForm} from 'app/Metadata';

function mapStateToProps(state) {
  return {
    model: 'library.metadata',
    metadata: state.library.metadata,
    state: state.library.metadataForm,
    templates: state.templates,
    thesauris: state.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit: saveDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
