import React, { useEffect, useState } from 'react';
import { Translate } from 'app/I18N';
import { ProgressBar } from 'app/UI';
import { LoadingWrapper } from 'app/components/Elements/LoadingWrapper';

const dummyapi = {
  get: async () =>
    Promise.resolve({
      users: { total: 12, admin: 2, editor: 4, collaborator: 6 },
      entities: { total: 25445 },
      files: { total: 1267 },
      storage: { total: 45000, available: 100000 },
    }),
};

const Dashboard = () => {
  const [systemStats, setSystemStats] = useState({
    users: { total: 0, admin: 0, editor: 0, collaborator: 0 },
    entities: { total: 0 },
    files: { total: 0 },
    storage: { total: 0, available: 100 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dummyapi
      .get()
      .then(response => {
        setSystemStats(response);
        setLoading(false);
      })
      .catch(() => {});

    return () => {
      setLoading(true);
    };
  }, []);

  return (
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
                  <h2>
                    <Translate>Users</Translate>
                  </h2>
                </div>
                <LoadingWrapper isLoading={loading}>
                  <div className="body">
                    <span className="count">{systemStats.users.total} </span>
                    <Translate>Total users</Translate>
                  </div>
                  <div className="footer">
                    {systemStats.users.admin > 0 && (
                      <p className="user-info">
                        <span className="count">{systemStats.users.admin} </span>
                        <Translate>Admin</Translate>
                      </p>
                    )}
                    {systemStats.users.editor > 0 && (
                      <p className="user-info">
                        <span className="count">{systemStats.users.editor} </span>
                        <Translate>Editor</Translate>
                      </p>
                    )}
                    {systemStats.users.collaborator > 0 && (
                      <p className="user-info">
                        <span className="count">{systemStats.users.collaborator} </span>
                        <Translate>Collaborator</Translate>
                      </p>
                    )}
                  </div>
                </LoadingWrapper>
              </article>

              <article className="card">
                <div className="heading">
                  <h2>
                    <Translate>Storage</Translate>
                  </h2>
                </div>
                <LoadingWrapper isLoading={loading}>
                  <div className="body">
                    <div className="usage">
                      <span className="used">{`${systemStats.storage.total / 1000} GB`} </span>
                      <span className="available">
                        {`${systemStats.storage.available / 1000} GB`}
                      </span>
                    </div>
                    <ProgressBar
                      max={systemStats.storage.available}
                      value={systemStats.storage.total}
                      useProgressColors
                      showNumericValue={false}
                    />
                  </div>
                </LoadingWrapper>
                <div className="footer">
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
                <LoadingWrapper isLoading={loading}>
                  <div className="body">
                    <span className="count">{systemStats.entities.total} </span>
                    <Translate>Total entities</Translate>
                  </div>
                </LoadingWrapper>
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
                <LoadingWrapper isLoading={loading}>
                  <div className="body">
                    <span className="count">{systemStats.files.total} </span>
                    <Translate>Total files</Translate>
                  </div>
                </LoadingWrapper>
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

export { Dashboard, dummyapi };
