import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import entities from 'app/Entities';
import {saveEntity} from 'app/Library/actions/libraryActions';
import MetadataForm from 'app/Templates/components/MetadataForm';

function mapStateToProps({library}) {
  return {
    model: 'library.metadata',
    metadata: library.metadata,
    state: library.metadataForm,
    templates: library.filters.get('templates'),
    thesauris: library.filters.get('thesauris')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: entities.actions.changeTemplate, onSubmit: saveEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
