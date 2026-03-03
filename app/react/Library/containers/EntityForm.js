import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from '#app/Multireducer/index.js';

import { saveEntity } from '#app/Library/actions/libraryActions.js';
import { actions, MetadataForm } from '#app/Metadata/index.js';

function mapStateToProps(state, props) {
  const { templates } = state;
  const { thesauris } = state;
  return {
    model: `${props.storeKey}.sidepanel.metadata`,
    templateId: state[props.storeKey].sidepanel.metadata.template,
    templates,
    thesauris,
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    { changeTemplate: actions.changeTemplate, onSubmit: saveEntity },
    wrapDispatch(dispatch, props.storeKey)
  );
}

const EntityForm = connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
export { EntityForm };
