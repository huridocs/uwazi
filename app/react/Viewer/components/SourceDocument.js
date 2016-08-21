import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {setSelection, unsetSelection} from 'app/Viewer/actions/selectionActions';
import {resetReferenceCreation, highlightReference, activateReference} from 'app/Viewer/actions/uiActions';
import Document from 'app/Viewer/components/Document';

const mapStateToProps = ({user, documentViewer}) => {
  let uiState = documentViewer.uiState.toJS();
  return {
    selection: uiState.reference.sourceRange,
    doc: documentViewer.doc,
    docHTML: documentViewer.docHTML,
    references: documentViewer.references.toJS(),
    className: 'sourceDocument',
    highlightedReference: uiState.highlightedReference,
    activeReference: uiState.activeReference,
    executeOnClickHandler: !!documentViewer.targetDoc.get('_id'),
    disableTextSelection: !user.get('_id'),
    panelIsOpen: !!documentViewer.uiState.get('panel'),
    forceSimulateSelection: documentViewer.uiState.get('panel') === 'targetReferencePanel'
      || documentViewer.uiState.get('panel') === 'referencePanel'
  };
};

function mapDispatchToProps(dispatch) {
  let actions = {setSelection,
    unsetSelection,
    onClick: resetReferenceCreation,
    highlightReference,
    activateReference
  };
  return bindActionCreators(actions, dispatch);
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  return Object.assign({}, stateProps, dispatchProps, ownProps, {
    unsetSelection: () => {
      if (!stateProps.panelIsOpen) {
        dispatchProps.unsetSelection();
      }
    }
  });
}
export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Document);
