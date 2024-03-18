import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Translate } from 'app/I18N';
import { IStore } from 'app/istore';
import { formatBytes } from 'V2/shared/formatHelpers';
import { SettingsHeader } from './SettingsHeader';
import SettingsAPI from '../SettingsAPI';

const mapStateToProps = (state: IStore) => ({
  stats: state.settings.stats,
});

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;

const DashboardComponent = ({ stats }: mappedProps) => {
  const [statistics, setStatistics] = useState(stats?.toJS());

  useEffect(() => {
    if (!statistics || !statistics.storage) {
      SettingsAPI.stats()
        .then(response => {
          setStatistics(response);
        })
        .catch(() => {});
    }
  }, []);

  if (!statistics || !statistics.storage) {
    return <div />;
  }

  const storage = formatBytes(statistics.storage.total);

  const [adminUsers, editorUsers, collaboratorUsers] = [
    statistics.users.admin,
    statistics.users.editor,
    statistics.users.collaborator,
  ];

  return (
    <main className="settings-content">
      <div className="settings-dashboard">
        <div className="panel-default">
          <SettingsHeader>
            <Translate>Dashboard</Translate>
          </SettingsHeader>
          <div className="panel-body">
            <div className="cards">
              <article className="card">
                <div className="heading">
                  <h2>
                    <Translate>Users</Translate>
                  </h2>
                </div>

                <div className="body">
                  <span className="count">{statistics.users.total} </span>
                  <Translate>Total users</Translate>
                </div>
                <div className="footer">
                  {adminUsers > 0 && (
                    <p className="user-info">
                      <span className="count">{adminUsers} </span>
                      <Translate>Admin</Translate>
                    </p>
                  )}
                  {editorUsers > 0 && (
                    <p className="user-info">
                      <span className="count">{editorUsers} </span>
                      <Translate>Editor</Translate>
                    </p>
                  )}
                  {collaboratorUsers > 0 && (
                    <p className="user-info">
                      <span className="count">{collaboratorUsers} </span>
                      <Translate>Collaborator</Translate>
                    </p>
                  )}
                </div>
              </article>

              <article className="card">
                <div className="heading">
                  <h2>
                    <Translate>Storage</Translate>
                  </h2>
                </div>

                <div className="body">
                  <span className="count">{storage}</span>
                </div>

                <div className="footer card-info">
                  <p className="card-info">
                    <Translate>Files and database usage</Translate>
                  </p>
                </div>
              </article>

              <article className="card">
                <div className="heading">
                  <h2>
                    <Translate>Entities</Translate>
                  </h2>
                </div>

                <div className="body">
                  <span className="count">{statistics.entities.total} </span>
                  <Translate>Total entities</Translate>
                </div>

                <div className="footer card-info">
                  <p className="card-info">
                    <Translate>Entities across all languages</Translate>
                  </p>
                </div>
              </article>

              <article className="card">
                <div className="heading">
                  <h2>
                    <Translate>Files</Translate>
                  </h2>
                </div>

                <div className="body">
                  <span className="count">{statistics.files.total} </span>
                  <Translate>Total files</Translate>
                </div>

                <div className="footer card-info">
                  <p className="card-info">
                    <Translate>
                      Total files from main documents, supporting files and custom uploads
                    </Translate>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const container = connector(DashboardComponent);
export { container as Dashboard };
