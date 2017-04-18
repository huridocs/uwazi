import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveEntity} from 'app/Entities/actions/actions';
import {actions, MetadataForm} from 'app/Metadata';

function mapStateToProps(state) {
  return {
    model: 'entityView.entityForm',
    isEntity: state.entityView.entity.get('type') === 'entity',
    templateId: state.entityView.entityForm.template,
    templates: state.templates,
    thesauris: state.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit: saveEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
