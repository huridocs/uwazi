import React from 'react';
import { Translate } from 'app/I18N';

const Dashboard = () => (
  <main className="settings-content">
    <div className="settings-dashboard">
      <div className="panel">
        <div className="panel-heading">
          <Translate>Dashboard</Translate>
        </div>

        <div className="panel-body">
          <div className="cards">
            <article className="card">
              <div className="heading">
                <h2>Users</h2>
              </div>
              <div className="body">
                <p>User info</p>
              </div>
            </article>

            <article className="card">
              <div className="heading">
                <h2>Entities</h2>
              </div>
              <div className="body">
                <p>Entities info</p>
              </div>
            </article>

            <article className="card">
              <div className="heading">
                <h2>Files</h2>
              </div>
              <div className="body">
                <p>Files info</p>
              </div>
            </article>

            <article className="card">
              <div className="heading">
                <h2>Storage</h2>
              </div>
              <div className="body">
                <p>Storage info</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </main>
);

export { Dashboard };
