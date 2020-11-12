import React from 'react';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { SidePanel } from 'app/Layout';
import { Icon } from 'UI';
import { t } from 'app/I18N';

export interface UserGroupSidePanelProps {
  userGroup: UserGroupSchema | undefined;
  opened: boolean;
  closePanel: (event: any) => void;
  onSave: (event: any) => void;
}

function addUser() {}

const UserGroupSidePanelComponent = ({
  userGroup,
  opened,
  closePanel,
  onSave,
}: UserGroupSidePanelProps) => {
  const group = userGroup || { name: '', members: [] };
  return (
    <SidePanel open={opened}>
      <div className="sidepanel-header">{userGroup?._id ? 'Edit' : 'Add'} Group</div>
      <div className="sidepanel-body">
        <form className="user-group-form" onSubmit={onSave}>
          <div className="form-group nested-selector">
            <label htmlFor="userGroup.name">Name of the group</label>
            <input type="text" className="form-control" autoComplete="off" value={group.name} />
          </div>
          <div className="search-box search-user nested-selector">
            <div className="input-group">
              <input
                type="text"
                placeholder={t('System', 'Add users', null, false)}
                className="form-control"
                autoComplete="off"
              />
              <Icon icon="search" onClick={addUser} aria-label="Search button" />
            </div>
          </div>
          <div>
            <div>{userGroup?.members && userGroup.members.map(member => member.username)}</div>
          </div>
        </form>
      </div>
      <div className="sidepanel-footer">
        <button
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
        <button
          type="submit"
          form="tocForm"
          onClick={closePanel}
          className="edit-toc btn btn-success"
        >
          <Icon icon="save" />
          <span className="btn-label">Save Group</span>
        </button>
      </div>
    </SidePanel>
  );
};

export const UserGroupSidePanel = UserGroupSidePanelComponent;
