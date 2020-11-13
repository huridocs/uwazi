import React, { useState } from 'react';
import { UserGroupSchema, GroupMemberSchema } from 'shared/types/userGroupType';
import { SidePanel } from 'app/Layout';
import { Icon } from 'UI';
import { t } from 'app/I18N';

export interface UserGroupSidePanelProps {
  userGroup: UserGroupSchema;
  opened: boolean;
  closePanel: (event: any) => void;
  onSave: (event: any) => void;
}

const UserGroupSidePanelComponent = ({
  userGroup,
  opened,
  closePanel,
  onSave,
}: UserGroupSidePanelProps) => {
  const [groupMembers, setGroupMembers] = useState(userGroup.members as GroupMemberSchema[]);
  function addUser(user: GroupMemberSchema) {
    setGroupMembers([...groupMembers, user]);
  }
  function removeUser(user: GroupMemberSchema) {
    const index = groupMembers.indexOf(user);
    groupMembers.splice(index, 1);
    setGroupMembers([...groupMembers] as GroupMemberSchema[]);
  }

  function updateGroup() {}

  return (
    <SidePanel open={opened}>
      <div className="sidepanel-header">{userGroup._id ? 'Edit' : 'Add'} Group</div>
      <div className="sidepanel-body">
        <form className="user-group-form" onSubmit={onSave}>
          <div id="name_field" className="form-group nested-selector">
            <label htmlFor="userGroup.name">Name of the group</label>
            <input
              type="text"
              className="form-control"
              autoComplete="off"
              value={userGroup.name}
              onChange={updateGroup}
            />
          </div>
          <div className="search-box search-user nested-selector">
            <div className="input-group">
              <input
                type="text"
                placeholder={t('System', 'Add users', null, false)}
                className="form-control"
                autoComplete="off"
                onChange={updateGroup}
              />
              <Icon icon="search" onClick={addUser} aria-label="Search button" />
            </div>
          </div>
          <div className="user-group-members">
            {groupMembers.map(member => (
              <div key={member._id as string} className="user-group-member">
                <div>{member.username}</div>
                <div>
                  <button
                    type="button"
                    onClick={() => removeUser(member)}
                    className="btn btn-danger btn-xs template-remove"
                  >
                    <Icon icon="trash-alt" />
                    &nbsp;
                    <span>{t('System', 'Remove')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </form>
      </div>
      <div className="sidepanel-footer">
        <button
          type="submit"
          id="discardChangesBtn"
          className="btn btn-primary"
          onClick={closePanel}
          aria-label="Close side panel"
        >
          <Icon icon="times" />
          <span className="btn-label">Discard Changes</span>
        </button>
        <button
          type="button"
          className="btn btn-outline-danger"
          value="Delete"
          onClick={closePanel}
        >
          <Icon icon="trash-alt" />
          <span className="btn-label">Delete Group</span>
        </button>
        <button type="submit" form="tocForm" onClick={closePanel} className="btn btn-success">
          <Icon icon="save" />
          <span className="btn-label">Save Group</span>
        </button>
      </div>
    </SidePanel>
  );
};

export const UserGroupSidePanel = UserGroupSidePanelComponent;
