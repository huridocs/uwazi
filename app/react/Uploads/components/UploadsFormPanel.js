import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import Immutable from 'immutable';

import SidePanel from 'app/Layout/SidePanel';
import DocumentForm from 'app/Uploads/components/DocumentForm';

export class UploadsFormPanel extends Component {
  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>Form</h1>
        <DocumentForm
          initialValues={this.props.document.toJS()}
          templates={this.props.templates.toJS()}
          thesauris={this.props.thesauris.toJS()}
        />
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
    templates: state.uploads.templates,
    thesauris: state.uploads.thesauris,
    document: state.uploads.documents.find(doc => uiState.get('documentBeingEdited') === doc.get('_id')) || Immutable.fromJS({})
  };
};

export default connect(mapStateToProps)(UploadsFormPanel);
