import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import SidePanel from 'app/Layout/SidePanel';

export class ViewMetadataPanel extends Component {
  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>METADATA</h1>
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  open: PropTypes.bool,
  references: PropTypes.array,
  highlightReference: PropTypes.func
};

const mapStateToProps = (state) => {
  let uiState = state.documentViewer.uiState.toJS();
  return {
    open: uiState.panel === 'viewMetadataPanel'
  };
};

export default connect(mapStateToProps)(ViewMetadataPanel);
