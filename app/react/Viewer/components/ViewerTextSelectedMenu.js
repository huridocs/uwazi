import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { CursorArrowRaysIcon } from '@heroicons/react/24/solid';
import { actions as connectionsActions } from 'app/Connections';
import { openPanel, toggleReferences } from 'app/Viewer/actions/uiActions';
import ShowIf from 'app/App/ShowIf';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';

import { addToToc } from '../actions/documentActions';

class ViewerTextSelectedMenu extends Component {
  handleDisable() {
    return this.props.toggleReferences();
  }

  showPanel(type) {
    this.props.openPanel('viewMetadataPanel');
    this.props.startNewConnection(type, this.props.doc.get('sharedId'));
  }

  render() {
    return (
      <div className={this.props.active ? 'active' : ''}>
        <ShowIf if={this.props.hasRelationTypes}>
          <div
            className="btn btn-primary connect-to-p"
            onClick={this.showPanel.bind(this, 'targetRanged')}
          >
            <span className="ContextMenu-tooltip">
              <Translate>Connect to a paragraph</Translate>
            </span>
            <Icon icon="paragraph" />
          </div>
          <div
            className="btn btn-primary connect-to-d"
            onClick={this.showPanel.bind(this, 'ranged')}
          >
            <span className="ContextMenu-tooltip">
              <Translate>Connect to an entity</Translate>
            </span>
            <Icon icon="file" />
          </div>
          <div
            className={`btn disable-click ${this.props.referenceState ? 'btn-primary' : 'btn-success'}`}
            onClick={this.handleDisable.bind(this)}
          >
            <span className="ContextMenu-tooltip">
              <Translate>Disable highlights</Translate>
            </span>
            <CursorArrowRaysIcon />
          </div>
        </ShowIf>
        <div
          className="btn btn-primary add-toc"
          onClick={this.props.addToToc.bind(null, this.props.reference.toJS(), this.props.file.toc)}
        >
          <span className="ContextMenu-tooltip">
            <Translate>Add to table of contents</Translate>
          </span>
          <Icon icon="font" />
        </div>
      </div>
    );
  }
}

ViewerTextSelectedMenu.propTypes = {
  doc: PropTypes.object,
  file: PropTypes.object.isRequired,
  reference: PropTypes.object,
  referenceState: PropTypes.bool,
  startNewConnection: PropTypes.func,
  openPanel: PropTypes.func,
  addToToc: PropTypes.func,
  active: PropTypes.bool,
  hasRelationTypes: PropTypes.bool,
  toggleReferences: PropTypes.func,
};

function mapStateToProps({ documentViewer, relationTypes }) {
  return {
    doc: documentViewer.doc,
    reference: documentViewer.uiState.get('reference'),
    referenceState: documentViewer.uiState.get('enableClickAction'),
    hasRelationTypes: !!relationTypes.size,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      startNewConnection: connectionsActions.startNewConnection,
      openPanel,
      addToToc,
      toggleReferences,
    },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerTextSelectedMenu);
export { ViewerTextSelectedMenu };
