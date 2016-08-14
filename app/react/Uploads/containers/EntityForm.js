import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import entities from 'app/Entities';

function mapStateToProps({uploads}) {
  return {
    model: 'uploads.entity',
    entity: uploads.entity,
    state: uploads.entityForm,
    templates: uploads.templates,
    thesauris: uploads.thesauris
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({changeTemplate: entities.actions.changeTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(entities.EntityForm);
