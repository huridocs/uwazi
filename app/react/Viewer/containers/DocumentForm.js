import {connect} from 'react-redux';
import {MetadataForm} from 'app/Metadata';

function mapStateToProps({documentViewer}) {
  return {
    model: 'documentViewer.sidepanel.metadata',
    metadata: documentViewer.sidepanel.metadata,
    state: documentViewer.sidepanel.metadataForm,
    templates: documentViewer.templates,
    thesauris: documentViewer.thesauris
  };
}

export default connect(mapStateToProps)(MetadataForm);
