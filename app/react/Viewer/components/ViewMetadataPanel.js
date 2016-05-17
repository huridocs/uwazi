import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import SidePanel from 'app/Layout/SidePanel';

export class ViewMetadataPanel extends Component {
  render() {
    const {doc} = this.props;

    return (
      <SidePanel open={this.props.open}>
        <h1>{doc.title}</h1>
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  doc: PropTypes.object,
  open: PropTypes.bool
};

const mapStateToProps = ({documentViewer}) => {
  return {
    open: documentViewer.uiState.get('panel') === 'viewMetadataPanel',
    doc: documentViewer.document
  };
};

export default connect(mapStateToProps)(ViewMetadataPanel);
