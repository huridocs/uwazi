import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {setSelection, unsetSelection} from 'app/Viewer/actions/selectionActions';
import {resetReferenceCreation} from 'app/Viewer/actions/uiActions';
import Document from 'app/Viewer/components/Document';

const mapStateToProps = (state) => {
  let uiState = state.documentViewer.uiState.toJS();
  return {
    selection: uiState.reference.sourceRange,
    document: state.documentViewer.document,
    references: state.documentViewer.references.toJS(),
    className: 'sourceDocument',
    executeOnClickHandler: !!state.documentViewer.targetDocument._id
  };
};

function mapDispatchToProps(dispatch) {
  let actions = {setSelection, unsetSelection, onClick: resetReferenceCreation};
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Document);
