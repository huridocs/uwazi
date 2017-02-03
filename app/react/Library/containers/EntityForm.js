import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveEntity} from 'app/Library/actions/libraryActions';
import {actions, MetadataForm} from 'app/Metadata';

function mapStateToProps(state) {
  return {
    model: 'library.sidepanel.metadata',
    metadata: state.library.sidepanel.metadata,
    state: state.library.sidepanel.metadataForm,
    templates: state.templates,
    thesauris: state.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit: saveEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
