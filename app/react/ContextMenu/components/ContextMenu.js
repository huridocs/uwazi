import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {openMenu, closeMenu} from 'app/ContextMenu/actions/contextMenuActions';
import ViewerDefaultMenu from 'app/Viewer/components/ViewerDefaultMenu';
import ViewerTextSelectedMenu from 'app/Viewer/components/ViewerTextSelectedMenu';
import 'app/ContextMenu/scss/contextMenu.scss';

export class ContextMenu extends Component {
  renderMenu() {
    if (this.props.type === 'ViewerTextSelectedMenu') {
      return <ViewerTextSelectedMenu />;
    }
    if (this.props.type === 'ViewerDefaultMenu') {
      return <ViewerDefaultMenu />;
    }
  }

  render() {
    return (
      <div
        className={'float-btn btn-fixed ' + (this.props.open ? 'active' : '')}
        onMouseEnter={this.props.openMenu}
        onMouseLeave={this.props.closeMenu}
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
