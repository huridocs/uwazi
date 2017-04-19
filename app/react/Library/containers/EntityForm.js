import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {wrapDispatch} from 'app/Multireducer';

import {saveEntity} from 'app/Library/actions/libraryActions';
import {actions, MetadataForm} from 'app/Metadata';

function mapStateToProps({library, templates, thesauris}) {
  return {
    model: 'library.sidepanel.metadata',
    isEntity: library.sidepanel.metadata.type === 'entity',
    templateId: library.sidepanel.metadata.template,
    templates: templates,
    thesauris: thesauris
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit: saveEntity}, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
