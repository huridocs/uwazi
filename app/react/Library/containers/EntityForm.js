import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveEntity} from 'app/Library/actions/libraryActions';
import {actions, MetadataForm} from 'app/Metadata';

function mapStateToProps({library, templates, thesauris}) {
  return {
    model: 'library.sidepanel.metadata',
    isEntity: library.sidepanel.metadata.type === 'entity',
    templateId: library.sidepanel.metadata.template,
    // state: library.sidepanel.metadataForm,
    templates: templates,
    thesauris: thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit: saveEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
