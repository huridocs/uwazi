import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';

import SidePanel from 'app/Layout/SidePanel';
import {highlightReference, closePanel, activateReference} from 'app/Viewer/actions/uiActions';

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

  render() {
    const uiState = this.props.uiState.toJS();
    const sidePanelprops = {open: uiState.panel === 'viewReferencesPanel'};
    const relationTypes = this.props.relationTypes.toJS();
    const referencedDocuments = this.props.referencedDocuments.toJS();

    return (
      <SidePanel {...sidePanelprops} className="document-references">
        <h1>DOCUMENT RELATIONSHIPS ({this.props.references.toJS().length})</h1>
        <i className="fa fa-close close-modal" onClick={this.props.closePanel}></i>
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
                <li key={index}
                  onMouseEnter={this.props.highlightReference.bind(null, reference._id)}
                  onMouseLeave={this.props.highlightReference.bind(null, null)}
                  onClick={this.props.activateReference.bind(null, reference._id)}
                  className={`item ${itemClass}`}
                  data-id={reference._id}
                  >
                    <div className="item-name">
                      <Link to={'/document/' + reference.targetDocument} className="item-name">
                        {this.documentTitle(reference.targetDocument, referencedDocuments)}
                      </Link>
                      {(() => {
                        if (reference.targetRange) {
                          return <div className="item-snippets">
                                  &gt; {reference.targetRange.text}
                                 </div>;
                        }
                      })()}
                    </div>
                    <div className="item-metadata">
                    {this.relationType(reference.relationType, relationTypes)}
                    <Link to={'/document/' + reference.targetDocument} className="item-shortcut"><i className="fa fa-file-o"></i></Link>
                    </div>
                </li>
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
  return bindActionCreators({highlightReference, closePanel, activateReference}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewReferencesPanel);
