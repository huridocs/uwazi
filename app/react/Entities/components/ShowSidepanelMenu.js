/** @format */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ShowIf from 'app/App/ShowIf';
import { Icon } from 'UI';

export class ShowSidepanelMenu extends Component {
  render() {
    const { panelIsOpen, openPanel, active } = this.props;
    return (
      <div className={active ? 'active' : ''}>
        <ShowIf if={!panelIsOpen}>
          <div className="btn btn-primary" onClick={e => openPanel(e)}>
            <Icon icon="columns" />
          </div>
        </ShowIf>
      </div>
    );
  }
}

ShowSidepanelMenu.defaultProps = {
  active: false,
};

ShowSidepanelMenu.propTypes = {
  active: PropTypes.bool,
  panelIsOpen: PropTypes.bool.isRequired,
  openPanel: PropTypes.func.isRequired,
};
