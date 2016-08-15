import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import entities from 'app/Entities';
import {saveEntity} from 'app/Uploads/actions/uploadsActions';
import MetadataForm from 'app/Templates/components/MetadataForm';

function mapStateToProps({uploads}) {
  return {
    model: 'uploads.metadata',
    entity: uploads.metadata,
    state: uploads.metadataForm,
    templates: uploads.templates,
    thesauris: uploads.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: entities.actions.changeTemplate, onSubmit: saveEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
