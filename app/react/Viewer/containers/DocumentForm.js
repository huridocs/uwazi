import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {DocumentForm, actions} from 'app/Documents';

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
  return bindActionCreators({changeTemplate: actions.changeTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentForm);
