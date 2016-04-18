import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import SidePanel from 'app/Layout/SidePanel';
import {highlightReference} from 'app/Viewer/actions/uiActions';

import 'app/Viewer/scss/viewReferencesPanel.scss';

export class ViewReferencesPanel extends Component {
  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <div className="item-group">
          {(() => {
            return this.props.references.map((reference, index) => {
              return (
                <li key={index}
                  onMouseEnter={this.props.highlightReference.bind(null, reference._id)}
                  onMouseLeave={this.props.highlightReference.bind(null, null)}
                >
                  <div className="item">
                    <div className="reference-type">
                      <i className="fa fa-file-text-o"></i>
                    </div>
                    <span className="item-name">{reference.targetDocument}</span>
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
  highlightReference: PropTypes.func
};

const mapStateToProps = (state) => {
  let uiState = state.documentViewer.uiState.toJS();
  return {
    open: uiState.panel === 'viewReferencesPanel',
    references: state.documentViewer.references.toJS()
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({highlightReference}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewReferencesPanel);
