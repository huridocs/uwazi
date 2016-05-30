import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import documents, {DocumentForm} from 'app/Documents';

function mapStateToProps({uploads}) {
  return {
    model: 'uploads.document',
    document: uploads.document,
    state: uploads.documentForm,
    templates: uploads.templates,
    thesauris: uploads.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: documents.actions.changeTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentForm);
