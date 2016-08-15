import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import documents from 'app/Documents';
import {saveDocument} from 'app/Uploads/actions/uploadsActions';
import MetadataForm from 'app/Templates/components/MetadataForm';

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
  return bindActionCreators({changeTemplate: documents.actions.changeTemplate, onSubmit: saveDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
