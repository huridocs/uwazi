import React from 'react';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { SidePanel } from 'app/Layout';
import { Icon } from 'UI';
import SearchForm from 'app/Connections/components/SearchForm';
import { t, Translate } from 'app/I18N';
import { Control, Field } from 'react-redux-form';

export interface UserGroupSidePanelProps {
  userGroup: UserGroupSchema;
  opened: boolean;
  closePanel: (event: any) => void;
  onSave: (event: any) => void;
}

function addUser() {}

let newUser: string;
const UserGroupSidePanelComponent = ({
  userGroup,
  opened,
  closePanel,
  onSave,
}: UserGroupSidePanelProps) => (
  <SidePanel open={opened}>
    <div className="sidepanel-header">{userGroup._id ? 'Edit' : 'Add'} Group</div>
    <div className="sidepanel-body">
      <form onSubmit={onSave}>
        <div>
          <Field model="userGroup.name">
            <label htmlFor="name">User group name</label>
            <input type="text" className="form-control" value={userGroup.name} />
          </Field>
        </div>
        <div>
          <Field model="userGroup.members">
            <Icon icon="search" />
            <input
              type="text"
              placeholder={t('System', 'Add users', null, false)}
              className="form-control"
              onChange={addUser}
              autoComplete="off"
              value={newUser}
            />
          </Field>
        </div>
        <div>{userGroup.members && userGroup.members.map(member => member.username)}</div>
      </form>
    </div>
  </SidePanel>
);

export const UserGroupSidePanel = UserGroupSidePanelComponent;
