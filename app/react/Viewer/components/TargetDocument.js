import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { setTargetSelection, unsetTargetSelection } from 'app/Viewer/actions/selectionActions';
import { highlightReference, selectReference } from 'app/Viewer/actions/uiActions';
import { selectTargetDoc, selectTargetReferences } from '../selectors';

import Document from './Document';
import TargetDocumentHeader from './TargetDocumentHeader';

const mapStateToProps = state => {
  const { documentViewer } = state;
  const uiState = documentViewer.uiState.toJS();

  return {
    doc: selectTargetDoc(state),
    references: selectTargetReferences(state),
    docHTML: documentViewer.targetDocHTML,
    selection: uiState.reference.targetRange,
    className: 'targetDocument',
    activeReference: uiState.activeReference,
    disableTextSelection: false,
    header: TargetDocumentHeader,
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setSelection: setTargetSelection,
      unsetSelection: unsetTargetSelection,
      highlightReference,
      activateReference: selectReference,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(Document);
