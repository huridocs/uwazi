import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import documents, {DocumentForm} from 'app/Documents';

function mapStateToProps({documentViewer}) {
  return {
    model: 'documentViewer.docForm',
    document: documentViewer.docForm,
    state: documentViewer.docFormState,
    templates: documentViewer.templates,
    thesauris: documentViewer.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: documents.actions.changeTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentForm);
