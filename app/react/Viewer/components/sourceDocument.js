import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {setSelection, unsetSelection} from 'app/Viewer/actions/selectionActions';
import Document from 'app/Viewer/components/Document';

const mapStateToProps = (state) => {
  let uiState = state.documentViewer.uiState.toJS();
  return {
    selection: uiState.reference.sourceRange,
    document: state.documentViewer.document,
    references: state.documentViewer.references.toJS(),
    className: 'sourceDocument'
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({setSelection, unsetSelection}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Document);
