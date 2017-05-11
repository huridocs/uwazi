import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {filterBaseProperties} from 'app/Entities/utils/filterBaseProperties';
import {saveEntity} from 'app/Entities/actions/actions';
import {actions, MetadataForm} from 'app/Metadata';

function onSubmit(data) {
  return saveEntity(filterBaseProperties(data));
}

function mapStateToProps(state) {
  return {
    model: 'entityView.entityForm',
    isEntity: state.entityView.entity.get('type') === 'entity',
    templateId: state.entityView.entityForm.template,
    templates: state.templates,
    thesauris: state.thesauris
  };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: actions.changeTemplate, onSubmit}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataForm);
