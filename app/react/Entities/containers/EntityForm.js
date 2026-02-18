import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { saveEntity, resetForm } from '#app/Entities/actions/actions.js';
import { actions, MetadataForm } from '#app/Metadata/index.js';

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

const EntityForm = connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
export { EntityForm };
