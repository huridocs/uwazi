import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Document from './Document';
import TargetDocumentHeader from './TargetDocumentHeader';
import {setTargetSelection, unsetTargetSelection} from 'app/Viewer/actions/selectionActions';

const mapStateToProps = ({documentViewer}) => {
  let uiState = documentViewer.uiState.toJS();
  return {
    doc: documentViewer.targetDoc,
    docHTML: documentViewer.targetDocHTML,
    selection: uiState.reference.targetRange,
    references: [],
    className: 'targetDocument',
    highlightReference: () => {},
    activateReference: () => {},
    disableTextSelection: false,
    header: TargetDocumentHeader
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    setSelection: setTargetSelection,
    unsetSelection: unsetTargetSelection
  },
  dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Document);
