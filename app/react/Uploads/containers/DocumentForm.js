import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveDocument} from 'app/Uploads/actions/uploadsActions';
import {actions, MetadataForm} from 'app/Metadata';

function mapStateToProps({uploads, templates, thesauris}) {
  return {
    model: 'uploads.metadata',
    isEntity: false,
    templateId: uploads.metadata.template,
    templates: templates,
    thesauris: thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit: saveDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
