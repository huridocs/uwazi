import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import documents from 'app/Documents';
import {bindActionCreators} from 'redux';
import {saveDocument} from '../actions/documentActions';
import {closePanel} from '../actions/uiActions';
import {actions as formActions} from 'react-redux-form';

import DocumentForm from '../containers/DocumentForm';
import {ShowDocument} from 'app/Documents';

export class ViewMetadataPanel extends Component {
  close() {
    this.props.resetForm('documentViewer.docForm');
    this.props.closePanel();
  }

  submit(doc) {
    this.props.saveDocument(doc);
  }

  render() {
    const {doc, docBeingEdited} = this.props;

    return (
      <SidePanel open={this.props.open}>
        <h1>{doc.title}</h1>
        <i className="fa fa-close close-modal" onClick={this.close.bind(this)}/>
        {(() => {
          if (docBeingEdited) {
            return <DocumentForm onSubmit={this.submit.bind(this)} />;
          }
          return <ShowDocument doc={doc}/>;
        })()}
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  doc: PropTypes.object,
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  saveDocument: PropTypes.func,
  closePanel: PropTypes.func,
  resetForm: PropTypes.func
};

const mapStateToProps = ({documentViewer}) => {
  return {
    open: documentViewer.uiState.get('panel') === 'viewMetadataPanel',
    doc: documents.helpers.prepareMetadata(documentViewer.doc.toJS(), documentViewer.templates.toJS(), documentViewer.thesauris.toJS()),
    docBeingEdited: !!documentViewer.docForm._id
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveDocument, closePanel, resetForm: formActions.reset}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewMetadataPanel);
