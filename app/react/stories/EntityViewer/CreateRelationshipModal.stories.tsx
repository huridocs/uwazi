import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { ClientRelationshipType } from '#app/apiResponseTypes.js';
import { CreateRelationshipModal } from '#V2/Routes/Entity/Components/relationships/index.js';
import { useRelationshipsActions } from '#V2/Routes/Entity/Components/context/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { searchByTitle } from '#V2/api/entities/index.js';
import { RelationshipsStoryShell } from './relationshipsStoryShell.js';

const mockEntities: Entity[] = [
  {
    _id: '1',
    sharedId: 'shared-1',
    title: 'Document about Human Rights',
    language: 'en',
    template: 'template-1',
    creationDate: Date.now(),
    user: 'user-1',
    metadata: {},
  },
];

const mockSearchFunction = async (searchString: string): ReturnType<typeof searchByTitle> => {
  await new Promise<void>(resolve => {
    setTimeout(resolve, 200);
  });
  return [
    mockEntities.filter(entity => entity.title.toLowerCase().includes(searchString.toLowerCase())),
    undefined,
  ];
};

const mockRelationshipTypes: ClientRelationshipType[] = [
  { _id: 'rel-1', name: 'Related to' },
  { _id: 'rel-2', name: 'Mentions' },
];

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

export { WithSelection, EntityLevel, mockSearchFunction, mockRelationshipTypes };
export default meta;
