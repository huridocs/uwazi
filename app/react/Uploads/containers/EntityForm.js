import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveEntity} from 'app/Uploads/actions/uploadsActions';
import {actions, MetadataForm} from 'app/Metadata';

function mapStateToProps({uploads}) {
  return {
    model: 'uploads.metadata',
    metadata: uploads.metadata,
    state: uploads.metadataForm,
    templates: uploads.templates,
    thesauris: uploads.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit: saveEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
