import React, { useEffect } from 'react';
import preview from '#storybook/preview';
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

const meta = preview.meta({
  title: 'EntityViewer/ManageRelationTypesModal',
  component: ManageRelationTypesModal,
});

const Primary = meta.story({
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
});

export { Primary };
