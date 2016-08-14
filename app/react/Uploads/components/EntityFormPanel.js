import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveEntity, finishEditEntity} from 'app/Uploads/actions/uploadsActions';
import SidePanel from 'app/Layout/SidePanel';
import EntityForm from '../containers/EntityForm';

export class EntityFormPanel extends Component {
  submit(entity) {
    this.props.saveEntity(entity);
  }

  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>Entity metadata</h1>
        <i className='fa fa-close close-modal' onClick={this.props.finishEditEntity}></i>
        <EntityForm onSubmit={this.submit.bind(this)}/>
      </SidePanel>
    );
  }
}

EntityFormPanel.propTypes = {
  open: PropTypes.bool,
  saveEntity: PropTypes.func,
  finishEditEntity: PropTypes.func,
  title: PropTypes.string
};

const mapStateToProps = ({uploads}) => {
  let uiState = uploads.uiState;
  return {
    open: uiState.get('showEntityForm'),
    title: uploads.entity.title
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveEntity, finishEditEntity}, dispatch);
}
export default connect(mapStateToProps, mapDispatchToProps)(EntityFormPanel);
