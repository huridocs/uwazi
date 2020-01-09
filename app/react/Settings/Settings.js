/** @format */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Helmet from 'react-helmet';

import SettingsNav from './components/SettingsNavigation';

export class Settings extends Component {
  render() {
    return (
      <div className="row settings">
        <Helmet title="Settings" />
        <div className="settings-navigation">
          <SettingsNav />
        </div>
        <div className="settings-content">{this.props.children}</div>
      </div>
    );
  }
}

Settings.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
};

export default Settings;
