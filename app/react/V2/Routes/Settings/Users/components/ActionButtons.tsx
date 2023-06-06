import React from 'react';
import { Button } from 'app/V2/Components/UI';
import { Translate } from 'app/I18N';
import { Row } from '@tanstack/react-table';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';

type ActionButtonsProps = {
  selectedUsers: Row<ClientUserSchema>[];
  selectedGroups: Row<ClientUserGroupSchema>[];
  activeTab: string;
  deleteAction: () => void;
  createAction: () => void;
};

const ActionButtons = ({
  selectedUsers,
  selectedGroups,
  activeTab,
  deleteAction,
  createAction,
}: ActionButtonsProps) => (
  <div className="flex gap-2 p-2 pt-1">
    {selectedUsers.length ? (
      <>
        <Button size="small" styling="light">
          <Translate>Reset password</Translate>
        </Button>
        <Button size="small" styling="light">
          <Translate>Reset 2FA</Translate>
        </Button>
      </>
    ) : undefined}

    {selectedUsers.length || selectedGroups.length ? (
      <Button size="small" color="error" onClick={deleteAction}>
        <Translate>Delete</Translate>
      </Button>
    ) : undefined}

    {!selectedUsers.length && !selectedGroups.length ? (
      <Button size="small" onClick={createAction}>
        {activeTab === 'Users' ? <Translate>Add user</Translate> : <Translate>Add group</Translate>}
      </Button>
    ) : undefined}
  </div>
);

export { ActionButtons };
