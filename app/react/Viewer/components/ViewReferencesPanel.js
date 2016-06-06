import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';

import SidePanel from 'app/Layout/SidePanel';
import {highlightReference, closePanel} from 'app/Viewer/actions/uiActions';
import {RowList, ItemFooter, ItemName} from 'app/Layout/Lists';

import 'app/Viewer/scss/viewReferencesPanel.scss';

export class ViewReferencesPanel extends Component {
  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>DOCUMENT RELATIONSHIPS ({this.props.references.length})</h1>
        <i className="fa fa-close close-modal" onClick={this.props.closePanel}></i>
        <div className="item-group">
          {(() => {
            return this.props.references.map((reference, index) => {
              return (
                <li key={index}
                  onMouseEnter={this.props.highlightReference.bind(null, reference._id)}
                  onMouseLeave={this.props.highlightReference.bind(null, null)}>
                  <div className="item">
                    <div className="item-name">
                      <Link to={'/document/' + reference.targetDocument} className="item-name">Titulo de prueba</Link>
                      {(() => {
                        if (reference.targetRange) {
                          return <div className="reference-text">
                                  &gt; {reference.targetRange.text}
                                 </div>;
                        }
                      })()}
                    </div>
                    <div className="item-metadata">
                    Supports (mock)
                      <a className="item-shortcut"><i className="fa fa-file-o"></i></a>
                    </div>
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
  open: PropTypes.bool,
  references: PropTypes.array,
  highlightReference: PropTypes.func,
  closePanel: PropTypes.func
};

const mapStateToProps = (state) => {
  let uiState = state.documentViewer.uiState.toJS();
  return {
    open: uiState.panel === 'viewReferencesPanel',
    references: state.documentViewer.references.toJS()
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({highlightReference, closePanel}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewReferencesPanel);
