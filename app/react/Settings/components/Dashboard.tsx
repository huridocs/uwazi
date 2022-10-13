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

  useEffect(() => {
    UsersAPI.get(new RequestParams())
      .then((response: UserSchema[]) => {
        setUsers(response);
        setUserBrakdown(groupBy(response, 'role'));
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
                  <h2>Users</h2>
                </div>
                <div className="body">
                  <span className="count">{users.length} </span>
                  <Translate>Total users</Translate>
                </div>
                <div className="footer">
                  {userBrakdown.admin && (
                    <p className="user-info">
                      <span className="count">{userBrakdown.admin.length} </span>
                      <Translate>Admins</Translate>
                    </p>
                  )}
                  {userBrakdown.editor && (
                    <p className="user-info">
                      <span className="count">{userBrakdown.editor.length} </span>
                      <Translate>Editors</Translate>
                    </p>
                  )}
                  {userBrakdown.collaborator && (
                    <p className="user-info">
                      <span className="count">{userBrakdown.collaborator.length} </span>
                      <Translate>Collaborators</Translate>
                    </p>
                  )}
                </div>
              </article>

              <article className="card">
                <div className="heading">
                  <h2>Storage</h2>
                </div>
                <div className="body">
                  <div className="usage">
                    <span className="used">8 GB </span>
                    <span className="total">16 GB</span>
                  </div>
                  <ProgressBar max={16} value={8} useProgressColors showNumericValue={false} />
                </div>
                <div className="footer">
                  <p className="card-info">
                    <Translate>File system storage</Translate>
                  </p>
                </div>
              </article>

              <article className="card">
                <div className="heading">
                  <h2>Entities</h2>
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
                  <h2>Files</h2>
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
