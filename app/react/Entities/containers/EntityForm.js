import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { saveEntity, resetForm } from 'app/Entities/actions/actions';
import { actions, MetadataForm } from 'app/Metadata';

function mapStateToProps(state) {
  return {
    model: 'entityView.entityForm',
    templateId: state.entityView.entityForm.template,
    templates: state.templates,
    thesauris: state.thesauris,
  };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      changeTemplate: actions.changeTemplate,
      onSubmit: saveEntity,
      componentWillUnmount: resetForm,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
