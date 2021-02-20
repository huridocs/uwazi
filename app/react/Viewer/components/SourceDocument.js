import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { setSelection, unsetSelection } from 'app/Viewer/actions/selectionActions';
import {
  resetReferenceCreation,
  highlightReference,
  activateReference,
  scrollToActive,
  deactivateReference,
} from 'app/Viewer/actions/uiActions';
import Document from 'app/Viewer/components/Document';
import { createSelector } from 'reselect';
import { selectDoc, selectReferences } from '../selectors';

const selectSourceRange = createSelector(
  s => s.uiState,
  u => u.toJS().reference.sourceRange
);
const selectActiveRef = createSelector(
  s => s.uiState,
  u => u.toJS().activeReference
);

const mapStateToProps = state => {
  const { user, documentViewer } = state;
  return {
    selectedSnippet: documentViewer.uiState.get('snippet'),
    selection: selectSourceRange(documentViewer),
    doScrollToActive: documentViewer.uiState.get('goToActive'),
    doc: selectDoc(state),
    references: selectReferences(state),
    className: 'sourceDocument',
    activeReference: selectActiveRef(documentViewer),
    executeOnClickHandler: !!documentViewer.targetDoc.get('_id'),
    disableTextSelection: !user.get('_id'),
    panelIsOpen: !!documentViewer.uiState.get('panel'),
    forceSimulateSelection:
      documentViewer.uiState.get('panel') === 'targetReferencePanel' ||
      documentViewer.uiState.get('panel') === 'referencePanel',
  };
};

function mapDispatchToProps(dispatch) {
  const actions = {
    setSelection,
    unsetSelection,
    onClick: resetReferenceCreation,
    highlightReference,
    activateReference,
    scrollToActive,
    deactivateReference,
  };
  return bindActionCreators(actions, dispatch);
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    unsetSelection: dispatchProps.unsetSelection,
  };
}
export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Document);
