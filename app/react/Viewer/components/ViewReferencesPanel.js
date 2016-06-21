import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';

import SidePanel from 'app/Layout/SidePanel';
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

  render() {
    const uiState = this.props.uiState.toJS();
    const sidePanelprops = {open: uiState.panel === 'viewReferencesPanel'};
    const relationTypes = this.props.relationTypes.toJS();
    const referencedDocuments = this.props.referencedDocuments.toJS();

    return (
      <SidePanel {...sidePanelprops} className="document-references">
        <h1>CONNECTIONS ({this.props.references.toJS().length})</h1>
        <i className="fa fa-close close-modal" onClick={this.close.bind(this)}></i>
        <div className="item-group">
          {(() => {
            return this.props.references.toJS().map((reference, index) => {
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
                      <span className="item-type item-type-0">Document</span>
                      <div className="item-name">
                        <Link to={'/document/' + reference.targetDocument} className="item-name" onClick={e => e.stopPropagation()}>
                          {this.documentTitle(reference.targetDocument, referencedDocuments)}
                        </Link>
                        {(() => {
                          if (reference.targetRange) {
                            return <div className="item-snippet">
                                    {reference.targetRange.text}
                                   </div>;
                          }
                        })()}
                      </div>
                    </div>
                    <div className="item-actions">
                      <span className="label label-default">{this.relationType(reference.relationType, relationTypes)}</span>
                      <Link to={'/document/' + reference.targetDocument}
                        onClick={e => e.stopPropagation()} className="item-shortcut"><i className="fa fa-file-o"></i><span>View</span><i className="fa fa-angle-right"></i></Link>
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
  closePanel: PropTypes.func
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
  return bindActionCreators({highlightReference, closePanel, activateReference, deactivateReference}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewReferencesPanel);
