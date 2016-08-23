import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveEntity} from 'app/Entities/actions/actions';
import {actions, MetadataForm} from 'app/Metadata';

function mapStateToProps(state) {
  return {
    model: 'entityView.entityForm',
    metadata: state.entityView.entity.toJS(),
    state: state.entityView.entityFormState,
    templates: state.templates,
    thesauris: state.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit: saveEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
