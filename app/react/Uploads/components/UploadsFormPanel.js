import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import SidePanel from 'app/Layout/SidePanel';

export class UploadsFormPanel extends Component {
  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>Form</h1>
      </SidePanel>
    );
  }
}

UploadsFormPanel.propTypes = {
  open: PropTypes.bool
};

const mapStateToProps = (state) => {
  let uiState = state.uploads.uiState;
  return {
    open: typeof uiState.get('documentBeingEdited') === 'string'
  };
};

export default connect(mapStateToProps)(UploadsFormPanel);
