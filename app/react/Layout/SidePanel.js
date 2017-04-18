import PropTypes from 'prop-types';
import React, { Component } from 'react';
import './scss/sidepanel.scss';

export class SidePanel extends Component {
  render() {
    let propsClass = this.props.className || '';
    return (
      <aside className={'side-panel ' + propsClass + ' ' + (this.props.open ? 'is-active' : 'is-hidden')}>
        {this.props.children}
      </aside>
    );
  }
}

SidePanel.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  className: PropTypes.string,
  open: PropTypes.bool
};

export default SidePanel;
