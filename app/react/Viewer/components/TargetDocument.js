import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { setTargetSelection, unsetTargetSelection } from 'app/Viewer/actions/selectionActions';
import Document from 'app/Viewer/components/Document';
import {
  highlightReference,
  selectReference,
  deactivateReference,
} from 'app/Viewer/actions/uiActions';
import { selectTargetDoc, selectTargetReferences } from '../selectors';

import TargetDocumentHeader from './TargetDocumentHeader';

const mapStateToProps = state => {
  const { documentViewer } = state;
  const uiState = documentViewer.uiState.toJS();
  const doc = selectTargetDoc(state);
  const file = doc.get('defaultDoc') ? doc.get('defaultDoc').toJS() : {};

  return {
    doc,
    file,
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
      deactivateReference,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(Document);
