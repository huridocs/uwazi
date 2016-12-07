import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {newEntity} from 'app/Uploads/actions/uploadsActions';

export class UploadsMenu extends Component {
  renderNormalMenu() {
    return (
      <div>
        <div className="btn btn-success"
             onClick={this.props.newEntity.bind(null, this.props.templates.toJS().filter((template) => template.isEntity))}>
          <span className="ContextMenu-tooltip">New Entity</span>
          <i className="fa fa-plus"></i>
        </div>
      </div>
    );
  }

  render() {
    if (this.props.metadataBeingEdited) {
      return null;
    }

    return this.renderNormalMenu();
  }
}

UploadsMenu.propTypes = {
  metadataBeingEdited: PropTypes.object,
  newEntity: PropTypes.func,
  templates: PropTypes.object
};

function mapStateToProps(state) {
  return {
    metadataBeingEdited: state.uploads.uiState.get('metadataBeingEdited'),
    templates: state.templates
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({newEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadsMenu);
