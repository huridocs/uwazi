import {connect} from 'react-redux';
import {MetadataForm} from 'app/Metadata';

function mapStateToProps({documentViewer}) {
  return {
    model: 'documentViewer.docForm',
    metadata: documentViewer.docForm,
    state: documentViewer.docFormState,
    templates: documentViewer.templates,
    thesauris: documentViewer.thesauris
  };
}

export default connect(mapStateToProps)(MetadataForm);
