import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actions, MetadataForm } from 'app/Metadata';
import { actions as relationshipActions } from 'app/Relationships';
import { saveDocument } from '../actions/documentActions';

function mapStateToProps({ documentViewer, templates, thesauris }) {
  return {
    model: 'documentViewer.sidepanel.metadata',
    isEntity: !documentViewer.sidepanel.file,
    templateId: documentViewer.sidepanel.metadata.template,
    templates,
    thesauris,
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  const { fileID, onEntitySave = () => {} } = ownProps;
  return bindActionCreators(
    {
      changeTemplate: actions.changeTemplate,
      onSubmit: doc => async (disp, state) => {
        const updateDoc = await saveDocument(doc, fileID)(disp, state);
        disp(relationshipActions.reloadRelationships(doc.sharedId));
        onEntitySave(updateDoc);
      },
    },
    dispatch
  );
}
const connected = connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
export { connected as DocumentForm, mapDispatchToProps };
