import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {openMenu, closeMenu} from 'app/ContextMenu/actions/contextMenuActions';

export class ContextMenu extends Component {
  render() {
    let children = React.Children.map(this.props.children, child => child) || [];
    let SubMenu = children.filter(child => {
      return child.type.name === this.props.type || child.type.WrappedComponent && child.type.WrappedComponent.name === this.props.type;
    });
    SubMenu = React.Children.map(SubMenu, (child) => React.cloneElement(child, {active: this.props.open}));

    return (
      <div
        className={'float-btn btn-fixed ' + (this.props.open ? 'active' : '')}
        onMouseEnter={this.props.openMenu}
        onMouseLeave={this.props.closeMenu}
        onClick={this.props.closeMenu}
      >
        {SubMenu}
      </div>
    );
  }
}

let childrenType = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.array
]);

ContextMenu.propTypes = {
  open: PropTypes.bool,
  type: PropTypes.string,
  openMenu: PropTypes.func,
  closeMenu: PropTypes.func,
  children: childrenType
};

const mapStateToProps = (state) => {
  return state.contextMenu.toJS();
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({openMenu, closeMenu}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu);
