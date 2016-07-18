import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import documents, {DocumentForm} from 'app/Documents';

function mapStateToProps({library}) {
  return {
    model: 'library.docForm',
    document: library.docForm,
    state: library.docFormState,
    templates: library.filters.get('templates'),
    thesauris: library.filters.get('thesauris')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: documents.actions.changeTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentForm);
