import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Translate } from 'app/I18N';
import { IStore } from 'app/istore';

const formatBytes = (bytes: number) => {
  //Sourced from https://stackoverflow.com/questions/15900485
  if (!+bytes || +bytes < 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / 1024 ** index).toFixed(2))} ${sizes[index]}`;
};

const mapStateToProps = (state: IStore) => ({
  stats: state.settings.stats,
});

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;

const DashboardComponent = ({ stats }: mappedProps) => {
  if (!stats) {
    return <div />;
  }

  const storage = formatBytes(stats.get('storage').get('total'));

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

                <div className="body">
                  <span className="count">{stats.get('users').get('total')} </span>
                  <Translate>Total users</Translate>
                </div>
                <div className="footer">
                  {stats.get('users').get('admin') > 0 && (
                    <p className="user-info">
                      <span className="count">{stats.get('users').get('admin')} </span>
                      <Translate>Admin</Translate>
                    </p>
                  )}
                  {stats.get('users').get('editor') > 0 && (
                    <p className="user-info">
                      <span className="count">{stats.get('users').get('editor')} </span>
                      <Translate>Editor</Translate>
                    </p>
                  )}
                  {stats.get('users').get('collaborator') > 0 && (
                    <p className="user-info">
                      <span className="count">{stats.get('users').get('collaborator')} </span>
                      <Translate>Collaborator</Translate>
                    </p>
                  )}
                </div>
              </article>

              {/*
              Card for storage report with available and total,
              disabled until we can report on total available storage effectivly.
              */}

              {/* <article className="card">
                <div className="heading">
                  <h2>
                    <Translate>Storage</Translate>
                  </h2>
                </div>

                  <div className="body">
                    <div className="usage">
                      <span className="used">{`${stats.storage.total / 1000} GB`} </span>
                      <span className="available">
                        {`${stats.storage.available / 1000} GB`}
                      </span>
                    </div>
                    <ProgressBar
                      max={stats.storage.available}
                      value={stats.storage.total}
                      useProgressColors
                      showNumericValue={false}
                    />
                  </div>

                <div className="footer">
                  <p className="card-info">
                    <Translate>Files and database usage</Translate>
                  </p>
                </div>
              </article>  */}

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
                  <span className="count">{stats.get('entities').get('total')} </span>
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
                  <span className="count">{stats.get('files').get('total')} </span>
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
