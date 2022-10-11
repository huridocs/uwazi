import React, { useEffect, useState } from 'react';
import { Dictionary, groupBy } from 'lodash';
import { Translate } from 'app/I18N';
import { UserSchema } from 'shared/types/userType';
import UsersAPI from 'app/Users/UsersAPI';
import { RequestParams } from 'app/utils/RequestParams';

const Dashboard = () => {
  const [users, setUsers] = useState<UserSchema[]>([]);
  const [userBrakdown, setUserBrakdown] = useState<Dictionary<UserSchema[]>>({
    admin: [],
    editor: [],
    collaborator: [],
  });

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
                  {users.length} <Translate>Total users</Translate>
                </div>
                <div className="footer">
                  <p>
                    {userBrakdown.admin.length} <Translate>Admins</Translate>
                  </p>
                  <p>
                    {userBrakdown.editor?.length || 0} <Translate>Editors</Translate>
                  </p>
                  <p>
                    {userBrakdown.collaborator?.length || 0} <Translate>Collaborators</Translate>
                  </p>
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
};

export { Dashboard };
