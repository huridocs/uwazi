import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {setSelection, unsetSelection} from 'app/Viewer/actions/selectionActions';
import {resetReferenceCreation, highlightReference, activateReference} from 'app/Viewer/actions/uiActions';
import Document from 'app/Viewer/components/Document';
import {createSelector} from 'reselect';

const selectConnections = createSelector(s => s.references, r => r.toJS());
const selectSourceRange = createSelector(s => s.uiState, u => u.toJS().reference.sourceRange);
const selectHighlightedRef = createSelector(s => s.uiState, u => u.toJS().highlightedReference);
const selectActiveRef = createSelector(s => s.uiState, u => u.toJS().activeReference);

const mapStateToProps = ({user, documentViewer}) => {
  return {
    selection: selectSourceRange(documentViewer),
    doc: documentViewer.doc,
    docHTML: documentViewer.docHTML,
    references: selectConnections(documentViewer),
    className: 'sourceDocument',
    highlightedReference: selectHighlightedRef(documentViewer),
    activeReference: selectActiveRef(documentViewer),
    executeOnClickHandler: !!documentViewer.targetDoc.get('_id'),
    disableTextSelection: !user.get('_id'),
    panelIsOpen: !!documentViewer.uiState.get('panel'),
    forceSimulateSelection: documentViewer.uiState.get('panel') === 'targetReferencePanel'
      || documentViewer.uiState.get('panel') === 'referencePanel'
  };
};

function mapDispatchToProps(dispatch) {
  let actions = {
    setSelection,
    unsetSelection,
    onClick: resetReferenceCreation,
    highlightReference,
    activateReference
  };
  return bindActionCreators(actions, dispatch);
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  return Object.assign({}, stateProps, dispatchProps, ownProps, {unsetSelection: dispatchProps.unsetSelection});
}
export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Document);
