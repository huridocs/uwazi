import React from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router';

const AppShell = ({ customParams }) => (
  <div id="app" className={customParams?.sharedId ? `pageId_${customParams.sharedId}` : ''}>
    <div className="alert-wrapper" />
    <div className="content">
      <main id="main" className="app-content container-fluid">
        <Outlet />
      </main>
    </div>
  </div>
);

AppShell.propTypes = { customParams: PropTypes.shape({ sharedId: PropTypes.string }) };

export { AppShell };
