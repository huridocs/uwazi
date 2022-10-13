import React, { useEffect, useState } from 'react';
import { Dictionary, groupBy } from 'lodash';
import { Translate } from 'app/I18N';
import { UserSchema } from 'shared/types/userType';
import UsersAPI from 'app/Users/UsersAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { ProgressBar } from 'app/UI';

const Dashboard = () => {
  const [users, setUsers] = useState<UserSchema[]>([]);
  const [userBrakdown, setUserBrakdown] = useState<Dictionary<UserSchema[]>>({});
  const [storage, setStorage] = useState({ current: 0, total: 0 });

  useEffect(() => {
    UsersAPI.get(new RequestParams())
      .then((response: UserSchema[]) => {
        setUsers(response);
        setUserBrakdown(groupBy(response, 'role'));
        setStorage({ current: 4, total: 8 });
      })
      .catch(() => {});
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
                <div className="body">
                  <span className="count">{users.length} </span>
                  <Translate>Total users</Translate>
                </div>
                <div className="footer">
                  {userBrakdown.admin && (
                    <p className="user-info">
                      <span className="count">{userBrakdown.admin.length} </span>
                      <Translate>Admin</Translate>
                    </p>
                  )}
                  {userBrakdown.editor && (
                    <p className="user-info">
                      <span className="count">{userBrakdown.editor.length} </span>
                      <Translate>Editor</Translate>
                    </p>
                  )}
                  {userBrakdown.collaborator && (
                    <p className="user-info">
                      <span className="count">{userBrakdown.collaborator.length} </span>
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
                  <div className="usage">
                    <span className="used">{`${storage.current} GB`} </span>
                    <span className="total">{`${storage.total} GB`}</span>
                  </div>
                  <ProgressBar
                    max={storage.total}
                    value={storage.current}
                    useProgressColors
                    showNumericValue={false}
                  />
                </div>
                <div className="footer">
                  <p className="card-info">
                    <Translate>File system storage</Translate>
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
                  <span className="count">56327 </span>
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
                  <span className="count">2500 </span>
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

export { Dashboard };
