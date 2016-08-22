import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import {formater, ShowMetadata} from 'app/Metadata';
import {bindActionCreators} from 'redux';
import {saveDocument, saveToc, editToc, removeFromToc, indentTocElement} from '../actions/documentActions';
import {closePanel, showTab} from '../actions/uiActions';
import {actions as formActions} from 'react-redux-form';

import DocumentForm from '../containers/DocumentForm';
import modals from 'app/Modals';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import Connections from './ConnectionsList';
import ShowIf from 'app/App/ShowIf';
import {NeedAuthorization} from 'app/Auth';
import {actions} from 'app/Metadata';
import {deleteDocument} from 'app/Viewer/actions/documentActions';
import {browserHistory} from 'react-router';
import {TocForm, ShowToc} from 'app/Documents';

export class ViewMetadataPanel extends Component {
  deleteDocument() {
    this.context.confirm({
      accept: () => {
        this.props.deleteDocument(this.props.rawDoc.toJS())
        .then(() => {
          browserHistory.push('/');
        });
      },
      title: 'Confirm delete document',
      message: 'Are you sure you want to delete this document?'
    });
  }

  close() {
    if (this.props.formState.dirty) {
      return this.props.showModal('ConfirmCloseForm', this.props.doc);
    }
    this.props.resetForm('documentViewer.docForm');
    this.props.showTab();
    this.props.closePanel();
  }

  submit(doc) {
    this.props.saveDocument(doc);
  }

  render() {
    const {doc, docBeingEdited} = this.props;

    let disabled = false;

    return (
      <SidePanel open={this.props.open} className='document-metadata'>
        <div className="sidepanel-header no-border">
          <h1>Metadata</h1>
          <i className="fa fa-close close-modal" onClick={this.close.bind(this)}/>
        </div>
        <ShowIf if={this.props.tab === 'metadata' || !this.props.tab}>
          <div className="sidepanel-footer">
            <NeedAuthorization>
              <ShowIf if={!docBeingEdited}>
                <button
                  onClick={() => this.props.loadInReduxForm('documentViewer.docForm', this.props.rawDoc.toJS(), this.props.templates.toJS())}
                  className="edit-metadata btn btn-primary">
                  <i className="fa fa-pencil"></i>
                  <span className="btn-label">Edit</span>
                </button>
              </ShowIf>
            </NeedAuthorization>
            <ShowIf if={docBeingEdited}>
              <button type="submit" form="metadataForm" disabled={disabled} className="edit-metadata btn btn-success">
                <i className="fa fa-save"></i>
                <span className="btn-label">Save</span>
              </button>
            </ShowIf>
            <a className="edit-metadata btn btn-primary" href={'/api/documents/download?_id=' + this.props.rawDoc.toJS()._id} target="_blank">
              <i className="fa fa-cloud-download"></i>
              <span className="btn-label">Download</span>
            </a>
            <NeedAuthorization>
              <button className="edit-metadata btn btn-danger" onClick={this.deleteDocument.bind(this)}>
                <i className="fa fa-trash"></i>
                <span className="btn-label">Delete</span>
              </button>
            </NeedAuthorization>
          </div>
        </ShowIf>
        <NeedAuthorization>
            <ShowIf if={this.props.tab === 'toc' && this.props.tocBeingEdited}>
              <div className="sidepanel-footer">
              <button type="submit" form="tocForm" className="edit-toc btn btn-success">
                <i className="fa fa-save"></i>
                <span className="btn-label">Save</span>
              </button>
              </div>
            </ShowIf>
        </NeedAuthorization>
        <NeedAuthorization>
            <ShowIf if={this.props.tab === 'toc' && !this.props.tocBeingEdited}>
              <div className="sidepanel-footer">
              <button onClick={() => this.props.editToc(this.props.doc.toc || [])} className="edit-toc btn btn-success">
                <i className="fa fa-pencil"></i>
                <span className="btn-label">Edit</span>
              </button>
              </div>
            </ShowIf>
        </NeedAuthorization>
        <div className="sidepanel-body">
          <Tabs selectedTab={this.props.tab || 'metadata'}
            handleSelect={(tab) => {
              this.props.showTab(tab);
            }}
          >
            <ul className="nav nav-tabs">
              <li>
                <TabLink to="toc">Table of contents</TabLink>
              </li>
              <li>
                <TabLink to="metadata" default>Metadata</TabLink>
              </li>
              <li>
                <TabLink to="connections">Connections&nbsp;({this.props.numberOfReferences})</TabLink>
              </li>
            </ul>
            <TabContent for="toc">
              <ShowIf if={!this.props.tocBeingEdited}>
                <ShowToc toc={doc.toc || []} />
              </ShowIf>
              <ShowIf if={this.props.tocBeingEdited}>
                <TocForm
                  removeEntry={this.props.removeFromToc}
                  indent={this.props.indentTocElement}
                  onSubmit={this.props.saveToc} model="documentViewer.tocForm"
                  state={this.props.tocFormState}
                  toc={this.props.tocForm}
                />
              </ShowIf>
            </TabContent>
            <TabContent for="metadata">
              {(() => {
                if (docBeingEdited) {
                  return <DocumentForm onSubmit={this.submit.bind(this)} />;
                }
                return <ShowMetadata entity={doc}/>;
              })()}
            </TabContent>
            <TabContent for="connections">
              <Connections />
            </TabContent>
          </Tabs>
        </div>
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  doc: PropTypes.object,
  formState: PropTypes.object,
  templates: PropTypes.object,
  rawDoc: PropTypes.object,
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  tocBeingEdited: PropTypes.bool,
  showTab: PropTypes.func,
  tab: PropTypes.string,
  saveDocument: PropTypes.func,
  closePanel: PropTypes.func,
  showModal: PropTypes.func,
  deleteDocument: PropTypes.func,
  resetForm: PropTypes.func,
  loadInReduxForm: PropTypes.func,
  numberOfReferences: PropTypes.number,
  tocFormState: PropTypes.object,
  tocForm: PropTypes.array,
  saveToc: PropTypes.func,
  editToc: PropTypes.func,
  removeFromToc: PropTypes.func,
  indentTocElement: PropTypes.func
};

ViewMetadataPanel.contextTypes = {
  confirm: PropTypes.func
};

const mapStateToProps = ({documentViewer}) => {
  let doc = formater.prepareMetadata(documentViewer.doc.toJS(), documentViewer.templates.toJS(), documentViewer.thesauris.toJS());

  if (documentViewer.targetDoc.get('_id')) {
    doc = formater.prepareMetadata(documentViewer.targetDoc.toJS(), documentViewer.templates.toJS(), documentViewer.thesauris.toJS());
  }

  return {
    open: documentViewer.uiState.get('panel') === 'viewMetadataPanel',
    templates: documentViewer.templates,
    doc,
    rawDoc: documentViewer.doc,
    docBeingEdited: !!documentViewer.docForm._id,
    formState: documentViewer.docFormState,
    tab: documentViewer.uiState.get('tab'),
    numberOfReferences: documentViewer.references.size,
    tocForm: documentViewer.tocForm || [],
    tocBeingEdited: documentViewer.tocBeingEdited,
    tocFormState: documentViewer.tocFormState
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    loadInReduxForm: actions.loadInReduxForm,
    showModal: modals.actions.showModal,
    showTab, saveDocument,
    closePanel,
    deleteDocument,
    resetForm: formActions.reset,
    saveToc,
    editToc,
    removeFromToc,
    indentTocElement
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewMetadataPanel);
