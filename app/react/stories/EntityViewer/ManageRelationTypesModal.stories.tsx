import React, { useEffect } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { ManageRelationTypesModal } from '#V2/Routes/Entity/Components/relationships/index.js';
import { useRelationshipsActions } from '#V2/Routes/Entity/Components/context/index.js';
import { RelationshipsStoryShell } from './relationshipsStoryShell.js';

const OpenOnMount = () => {
  const { openManageRelationTypes } = useRelationshipsActions();
  useEffect(() => {
    openManageRelationTypes();
  }, [openManageRelationTypes]);
  return null;
};

const meta: Meta<typeof ManageRelationTypesModal> = {
  title: 'EntityViewer/ManageRelationTypesModal',
  component: ManageRelationTypesModal,
};

type Story = StoryObj<typeof ManageRelationTypesModal>;

const Primary: Story = {
  render: () => (
    <RelationshipsStoryShell
      locale="en"
      user={{ _id: '1', role: 'admin', username: 'admin', email: 'admin@example.com' }}
    >
      <>
        <OpenOnMount />
        <ManageRelationTypesModal />
      </>
    </RelationshipsStoryShell>
  ),
};

export { Primary };
export default meta;
