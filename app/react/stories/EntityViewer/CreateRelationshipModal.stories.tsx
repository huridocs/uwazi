import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { CreateRelationshipModal } from '#V2/Routes/Entity/Components/relationships/index.js';
import { useRelationshipsActions } from '#V2/Routes/Entity/Components/context/index.js';
import { RelationshipsStoryShell } from './relationshipsStoryShell.js';

const mockSelection: TextSelection = {
  text: 'This is a selected text from the document',
  selectionRectangles: [{ top: 100, left: 50, width: 200, height: 20, regionId: '1' }],
};

const ModalOpener = ({ selection }: { selection?: TextSelection }) => {
  const { openCreateRelationship } = useRelationshipsActions();
  return (
    <button type="button" onClick={() => openCreateRelationship(selection)}>
      Open modal
    </button>
  );
};

const meta: Meta<typeof CreateRelationshipModal> = {
  title: 'EntityViewer/CreateRelationshipModal',
  component: CreateRelationshipModal,
};

type Story = StoryObj<typeof CreateRelationshipModal>;

const Primary: Story = {
  render: () => (
    <RelationshipsStoryShell locale="en">
      <>
        <ModalOpener selection={mockSelection} />
        <CreateRelationshipModal />
      </>
    </RelationshipsStoryShell>
  ),
};

const WithSelection: Story = {
  ...Primary,
  play: async ({ canvasElement }) => {
    canvasElement.querySelector('button')?.click();
  },
};

const EntityLevel: Story = {
  render: () => (
    <RelationshipsStoryShell locale="en">
      <>
        <ModalOpener />
        <CreateRelationshipModal />
      </>
    </RelationshipsStoryShell>
  ),
};

export { WithSelection, EntityLevel };
export default meta;
