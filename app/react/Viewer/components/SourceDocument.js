import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {setSelection, unsetSelection} from 'app/Viewer/actions/selectionActions';
import {resetReferenceCreation, highlightReference, activateReference} from 'app/Viewer/actions/uiActions';
import Document from 'app/Viewer/components/Document';

const mapStateToProps = ({documentViewer}) => {
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
    disableTextSelection: documentViewer.uiState.get('panel') === 'viewMetadataPanel'
      || documentViewer.uiState.get('panel') === 'viewReferencesPanel',
    forceSimulateSelection: documentViewer.uiState.get('panel') === 'targetReferencePanel'
      || documentViewer.uiState.get('panel') === 'referencePanel'
  };
};

function mapDispatchToProps(dispatch) {
  let actions = {setSelection, unsetSelection, onClick: resetReferenceCreation, highlightReference, activateReference};
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Document);
