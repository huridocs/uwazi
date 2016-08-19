import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import {formater, ShowMetadata} from 'app/Metadata';
import {bindActionCreators} from 'redux';
import {saveDocument} from '../actions/documentActions';
import {closePanel, showTab} from '../actions/uiActions';
import {actions as formActions} from 'react-redux-form';

import DocumentForm from '../containers/DocumentForm';
import modals from 'app/Modals';
import {Tabs, TabLink, TabContent} from 'react-tabs-redux';
import Connections from './ConnectionsList';

export class ViewMetadataPanel extends Component {
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

    return (
      <SidePanel open={this.props.open} className='document-metadata'>
        <div className="sidepanel-header">
          <h1>Metadata</h1>
          <i className="fa fa-close close-modal" onClick={this.close.bind(this)}/>
        </div>
        <div className="sidepanel-body">
          <Tabs selectedTab={this.props.tab}
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
                <TabLink to="connections">Connections (22)</TabLink>
              </li>
            </ul>
            <TabContent for="toc">
              TOC
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
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  showTab: PropTypes.func,
  tab: PropTypes.string,
  saveDocument: PropTypes.func,
  closePanel: PropTypes.func,
  showModal: PropTypes.func,
  resetForm: PropTypes.func
};

const mapStateToProps = ({documentViewer}) => {
  let doc = formater.prepareMetadata(documentViewer.doc.toJS(), documentViewer.templates.toJS(), documentViewer.thesauris.toJS());

  if (documentViewer.targetDoc.get('_id')) {
    doc = formater.prepareMetadata(documentViewer.targetDoc.toJS(), documentViewer.templates.toJS(), documentViewer.thesauris.toJS());
  }

  return {
    open: documentViewer.uiState.get('panel') === 'viewMetadataPanel',
    doc,
    docBeingEdited: !!documentViewer.docForm._id,
    formState: documentViewer.docFormState,
    tab: documentViewer.uiState.get('tab')
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({showModal: modals.actions.showModal, showTab, saveDocument, closePanel, resetForm: formActions.reset}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewMetadataPanel);
