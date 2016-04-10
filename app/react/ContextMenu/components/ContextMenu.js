import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {openMenu, closeMenu} from 'app/ContextMenu/actions/contextMenuActions';
import 'app/ContextMenu/scss/contextMenu.scss';

export class ContextMenu extends Component {
  render() {
    return (
      <div
        className={'context-menu ' + (this.props.open ? 'open' : '')}
        onMouseEnter={this.props.openMenu}
        onMouseLeave={this.props.closeMenu}
      >
      </div>
    );
  }
}

ContextMenu.propTypes = {
  open: PropTypes.bool,
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
