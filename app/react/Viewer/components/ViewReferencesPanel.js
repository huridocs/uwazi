import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';
import {NeedAuthorization} from 'app/Auth';

import SidePanel from 'app/Layout/SidePanel';
import {deleteReference} from 'app/Viewer/actions/referencesActions';
import {highlightReference, closePanel, activateReference, deactivateReference} from 'app/Viewer/actions/uiActions';

import 'app/Viewer/scss/viewReferencesPanel.scss';

export class ViewReferencesPanel extends Component {

  relationType(id, relationTypes) {
    let type = relationTypes.find((relation) => relation._id === id);
    if (type) {
      return type.name;
    }
  }

  documentTitle(id, referencedDocuments) {
    let docu = referencedDocuments.find((doc) => doc._id === id);
    if (docu) {
      return docu.title;
    }
  }

  close() {
    this.props.closePanel();
    this.props.deactivateReference();
  }

  deleteReference(reference) {
    this.context.confirm({
      accept: () => {
        this.props.deleteReference(reference);
      },
      title: 'Confirm delete connection',
      message: 'Are you sure you want to delete this connection?'
    });
  }

  render() {
    const uiState = this.props.uiState.toJS();
    const sidePanelprops = {open: uiState.panel === 'viewReferencesPanel'};
    const relationTypes = this.props.relationTypes.toJS();
    const referencedDocuments = this.props.referencedDocuments.toJS();
    const references = this.props.references.toJS().sort((a, b) => {
      return a.sourceRange.start - b.sourceRange.start;
    });

    return (
      <SidePanel {...sidePanelprops} className="document-references">
        <h1>CONNECTIONS ({this.props.references.toJS().length})</h1>
        <i className="fa fa-close close-modal" onClick={this.close.bind(this)}></i>
        <div className="item-group">
          {(() => {
            return references.map((reference, index) => {
              let itemClass = '';
              if (uiState.highlightedReference === reference._id) {
                itemClass = 'relationship-hover';
              }

              if (uiState.activeReference === reference._id) {
                itemClass = 'relationship-active';
              }
              return (
                <div key={index}
                  onMouseEnter={this.props.highlightReference.bind(null, reference._id)}
                  onMouseLeave={this.props.highlightReference.bind(null, null)}
                  onClick={this.props.activateReference.bind(null, reference._id)}
                  className={`item ${itemClass}`}
                  data-id={reference._id}
                  >
                    <div className="item-info">
                      <div className="item-name">
                        {this.documentTitle(reference.targetDocument, referencedDocuments)}
                        {(() => {
                          if (reference.targetRange) {
                            return <div className="item-snippet">
                                    {reference.targetRange.text}
                                   </div>;
                          }
                        })()}
                      </div>
                    </div>
                    <div className="item-metadata">
                      <dl>
                        <dt>Connection type</dt>
                        <dd>{this.relationType(reference.relationType, relationTypes)}</dd>
                      </dl>
                    </div>
                    <div className="item-actions">
                      <NeedAuthorization>
                        <a className="item-shortcut" onClick={this.deleteReference.bind(this, reference)}>
                          <i className="fa fa-unlink"></i><span>Delete</span>
                        </a>
                      </NeedAuthorization>
                      &nbsp;
                      <Link to={'/document/' + reference.targetDocument} onClick={e => e.stopPropagation()} className="item-shortcut">
                        <i className="fa fa-file-o"></i><span>View</span><i className="fa fa-angle-right"></i>
                      </Link>
                    </div>
                </div>
                );
            });
          })()}
        </div>
      </SidePanel>
    );
  }
}

ViewReferencesPanel.propTypes = {
  uiState: PropTypes.object,
  references: PropTypes.object,
  referencedDocuments: PropTypes.object,
  relationTypes: PropTypes.object,
  highlightReference: PropTypes.func,
  activateReference: PropTypes.func,
  deactivateReference: PropTypes.func,
  closePanel: PropTypes.func,
  deleteReference: PropTypes.func
};

ViewReferencesPanel.contextTypes = {
  confirm: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    uiState: state.documentViewer.uiState,
    references: state.documentViewer.references,
    referencedDocuments: state.documentViewer.referencedDocuments,
    relationTypes: state.documentViewer.relationTypes
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({highlightReference, closePanel, activateReference, deactivateReference, deleteReference}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewReferencesPanel);
