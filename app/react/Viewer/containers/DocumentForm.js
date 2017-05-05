import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions, MetadataForm} from 'app/Metadata';
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

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit: saveDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
