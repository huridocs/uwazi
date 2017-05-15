import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {wrapDispatch} from 'app/Multireducer';

import {filterBaseProperties} from 'app/Entities/utils/filterBaseProperties';
import {saveEntity} from 'app/Library/actions/libraryActions';
import {actions, MetadataForm} from 'app/Metadata';

function onSubmit(data) {
  return saveEntity(filterBaseProperties(data));
}

function mapStateToProps(state, props) {
  const templates = state.templates;
  const thesauris = state.thesauris;
  return {
    model: props.storeKey + '.sidepanel.metadata',
    isEntity: state[props.storeKey].sidepanel.metadata.type === 'entity',
    templateId: state[props.storeKey].sidepanel.metadata.template,
    templates: templates,
    thesauris: thesauris
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit}, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
