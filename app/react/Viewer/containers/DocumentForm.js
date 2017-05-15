import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions, MetadataForm} from 'app/Metadata';
import {filterBaseProperties} from 'app/Entities/utils/filterBaseProperties';
import {saveDocument} from '../actions/documentActions';

function onSubmit(data) {
  return saveDocument(filterBaseProperties(data));
}

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
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
