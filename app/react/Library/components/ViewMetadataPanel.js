import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import documents from 'app/Documents';
import {bindActionCreators} from 'redux';
import {unselectDocument, saveDocument} from '../actions/libraryActions';

import DocumentForm from '../containers/DocumentForm';
import {ShowDocument} from 'app/Documents';
import {actions as formActions} from 'react-redux-form';
import modals from 'app/Modals';

export class ViewMetadataPanel extends Component {
  submit(doc) {
    this.props.saveDocument(doc);
  }

  close() {
    if (this.props.formState.dirty) {
      return this.props.showModal('ConfirmCloseForm', this.props.doc);
    }
    this.props.unselectDocument();
    this.props.resetForm('library.docForm');
  }

  render() {
    const {doc, docBeingEdited} = this.props;

    return (
      <SidePanel open={this.props.open}>
        <div className="sidepanel-header">
          <h1>Metadata</h1>
          <i className="fa fa-close close-modal" onClick={this.close.bind(this)}/>
        </div>
        <div className="sidepanel-body">
          <ul className="nav nav-tabs">
            <li>
              <a href="#">Table of content</a>
            </li>
            <li className="active">
              <a href="#">Metadata</a>
            </li>
            <li>
              <a href="#">Connections (22)</a>
            </li>
          </ul>
          {(() => {
            if (docBeingEdited) {
              return <DocumentForm onSubmit={this.submit.bind(this)} />;
            }
            return <ShowDocument doc={doc}/>;
          })()}
        </div>
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  doc: PropTypes.object,
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  saveDocument: PropTypes.func,
  unselectDocument: PropTypes.func,
  resetForm: PropTypes.func,
  formState: PropTypes.object,
  showModal: PropTypes.func
};

const mapStateToProps = ({library}) => {
  return {
    open: library.ui.get('selectedDocument') ? true : false,
    docBeingEdited: !!library.docForm._id,
    formState: library.docFormState,
    doc: documents.helpers.prepareMetadata(library.ui.get('selectedDocument') ? library.ui.get('selectedDocument').toJS() : {},
                                           library.filters.get('templates').toJS(),
                                           library.filters.get('thesauris').toJS())
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({unselectDocument, resetForm: formActions.reset, saveDocument, showModal: modals.actions.showModal}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewMetadataPanel);
