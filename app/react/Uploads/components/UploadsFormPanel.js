import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import Immutable from 'immutable';

import SidePanel from 'app/Layout/SidePanel';
import DocumentForm from 'app/DocumentForm/components/DocumentForm';

export class UploadsFormPanel extends Component {
  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>Form</h1>
        <DocumentForm templates={this.props.templates} thesauris={this.props.thesauris}/>
      </SidePanel>
    );
  }
}

UploadsFormPanel.propTypes = {
  open: PropTypes.bool,
  document: PropTypes.object,
  templates: PropTypes.object,
  thesauris: PropTypes.object
};

const mapStateToProps = (state) => {
  let uiState = state.uploads.uiState;
  return {
    open: typeof uiState.get('documentBeingEdited') === 'string',
    document: state.uploads.documents.find(doc => uiState.get('documentBeingEdited') === doc.get('_id')) || Immutable.fromJS({}),
    templates: state.uploads.templates,
    thesauris: state.uploads.thesauris
  };
};

export default connect(mapStateToProps)(UploadsFormPanel);
