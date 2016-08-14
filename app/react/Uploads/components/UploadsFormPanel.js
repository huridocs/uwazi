import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {saveDocument, finishEdit} from 'app/Uploads/actions/uploadsActions';
import SidePanel from 'app/Layout/SidePanel';
import DocumentForm from '../containers/DocumentForm';

export class UploadsFormPanel extends Component {
  submit(doc) {
    this.props.saveDocument(doc);
  }

  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <div className="sidepanel-header">
          <h1>Document metadata</h1>
          <i className='fa fa-close close-modal' onClick={this.props.finishEdit}></i>
        </div>
        <div className="sidepanel-body">
          <DocumentForm onSubmit={this.submit.bind(this)}/>
        </div>
      </SidePanel>
    );
  }
}

UploadsFormPanel.propTypes = {
  open: PropTypes.bool,
  saveDocument: PropTypes.func,
  finishEdit: PropTypes.func,
  title: PropTypes.string
};

const mapStateToProps = ({uploads}) => {
  let uiState = uploads.uiState;
  return {
    open: typeof uiState.get('documentBeingEdited') === 'string',
    title: uploads.document.title
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveDocument, finishEdit}, dispatch);
}
export default connect(mapStateToProps, mapDispatchToProps)(UploadsFormPanel);
