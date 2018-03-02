import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions, MetadataForm} from 'app/Metadata';
import {actions as relationshipActions} from 'app/Relationships';
import {saveDocument} from '../actions/documentActions';

function mapStateToProps({documentViewer, templates, thesauris}) {
  return {
    model: 'documentViewer.sidepanel.metadata',
    isEntity: documentViewer.sidepanel.metadata.type === 'entity',
    templateId: documentViewer.sidepanel.metadata.template,
    templates,
    thesauris
  };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    changeTemplate: actions.changeTemplate,
    onSubmit: (doc) => {
      return (disp) => {
        return saveDocument(doc)(disp)
        .then(() => {
          disp(relationshipActions.reloadRelationships(doc.sharedId));
        });
      };
    }
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
