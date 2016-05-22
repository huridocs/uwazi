import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {openMenu, closeMenu} from 'app/ContextMenu/actions/contextMenuActions';
import ViewerDefaultMenu from 'app/Viewer/components/ViewerDefaultMenu';
import ViewerTextSelectedMenu from 'app/Viewer/components/ViewerTextSelectedMenu';
import ViewerSaveReferenceMenu from 'app/Viewer/components/ViewerSaveReferenceMenu';
import ViewerSaveTargetReferenceMenu from 'app/Viewer/components/ViewerSaveTargetReferenceMenu';
import UploadsMenu from 'app/Uploads/components/UploadsMenu';
import LibraryMenu from 'app/Library/components/LibraryMenu';

export class ContextMenu extends Component {
  renderMenu() {
    if (this.props.type === 'ViewerTextSelectedMenu') {
      return <ViewerTextSelectedMenu active={this.props.open} />;
    }
    if (this.props.type === 'ViewerDefaultMenu') {
      return <ViewerDefaultMenu active={this.props.open} />;
    }
    if (this.props.type === 'ViewerSaveReferenceMenu') {
      return <ViewerSaveReferenceMenu />;
    }
    if (this.props.type === 'ViewerSaveTargetReferenceMenu') {
      return <ViewerSaveTargetReferenceMenu />;
    }
    if (this.props.type === 'UploadsMenu') {
      return <UploadsMenu active={this.props.open} />;
    }
    if (this.props.type === 'LibraryMenu') {
      return <LibraryMenu />;
    }
  }

  render() {
    return (
      <div
        className={'float-btn btn-fixed ' + (this.props.open ? 'active' : '')}
        onMouseEnter={this.props.openMenu}
        onMouseLeave={this.props.closeMenu}
        onClick={this.props.closeMenu}
      >
        {this.renderMenu()}
      </div>
    );
  }
}

ContextMenu.propTypes = {
  open: PropTypes.bool,
  type: PropTypes.string,
  openMenu: PropTypes.func,
  closeMenu: PropTypes.func
};

const mapStateToProps = (state) => {
  return state.contextMenu.toJS();
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({openMenu, closeMenu}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu);
