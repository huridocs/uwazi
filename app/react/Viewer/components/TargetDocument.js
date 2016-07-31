import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Document from './Document';
import TargetDocumentHeader from './TargetDocumentHeader';
import {setTargetSelection, unsetTargetSelection} from 'app/Viewer/actions/selectionActions';
import {highlightReference, activateReference} from 'app/Viewer/actions/uiActions';

const mapStateToProps = ({documentViewer}) => {
  let uiState = documentViewer.uiState.toJS();
  
  return {
    doc: documentViewer.targetDoc,
    docHTML: documentViewer.targetDocHTML,
    selection: uiState.reference.targetRange,
    references: documentViewer.targetDocReferences.toJS(),
    className: 'targetDocument',
    highlightedReference: uiState.highlightedReference,
    activeReference: uiState.activeReference,
    disableTextSelection: false,
    header: TargetDocumentHeader
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    setSelection: setTargetSelection,
    unsetSelection: unsetTargetSelection,
    highlightReference,
    activateReference
  },
  dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Document);
