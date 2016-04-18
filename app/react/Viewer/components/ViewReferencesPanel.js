import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import SidePanel from 'app/Layout/SidePanel';

export class ViewReferencesPanel extends Component {
  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>References</h1>

      </SidePanel>
    );
  }
}

ViewReferencesPanel.propTypes = {
  open: PropTypes.bool
};

const mapStateToProps = (state) => {
  let uiState = state.documentViewer.uiState.toJS();
  return {
    open: uiState.panel === 'viewReferencesPanel'
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewReferencesPanel);
