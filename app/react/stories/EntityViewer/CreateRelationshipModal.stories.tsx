import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { useAtomValue } from 'jotai';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import type { ClientUserSchema } from '#app/apiResponseTypes.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import { Modal } from '#V2/Components/UI/index.js';
import { useRelationshipsActions } from '#V2/Routes/Entity/Components/context/index.js';
import { CreateRelationshipModalHeader } from '#V2/Routes/Entity/Components/relationships/create-reference/CreateRelationshipModalHeader.js';
import { RelationTypeStep } from '#V2/Routes/Entity/Components/relationships/create-reference/RelationTypeStep.js';
import { CreateRelationshipModal } from '#V2/Routes/Entity/Components/relationships/index.js';
import { apiEntity } from '../fixtures/referencesFixtures.js';
import { RelationshipsStoryShell } from './relationshipsStoryShell.js';

const mockSelection: TextSelection = {
  text: 'This is a selected text from the document',
  selectionRectangles: [{ top: 100, left: 50, width: 200, height: 20, regionId: '1' }],
};

const adminUser: ClientUserSchema = {
  _id: '1',
  role: 'admin',
  username: 'admin',
  email: 'admin@example.com',
};

const editorUser: ClientUserSchema = {
  _id: '2',
  role: 'editor',
  username: 'editor',
  email: 'editor@example.com',
};

const ModalOpener = ({ selection }: { selection?: TextSelection }) => {
  const { openCreateRelationship } = useRelationshipsActions();
  return (
    <button type="button" onClick={() => openCreateRelationship(selection)}>
      Open modal
    </button>
  );
};

const RelationTypeStepPreview = () => {
  const types = useAtomValue(relationshipTypesAtom);
  const [selected, setSelected] = useState<string>();
  return (
    <Modal size="lg" ariaLabel="Choose relation type">
      <CreateRelationshipModalHeader
        step="relation"
        selectionPreview={undefined}
        isSaving={false}
        onClose={() => undefined}
      />
      <RelationTypeStep
        selectedEntity={apiEntity}
        selectedFile={undefined}
        relationshipTypes={types}
        selectedRelationshipType={selected}
        isSaving={false}
        onBack={() => undefined}
        onRelationshipTypeSelect={setSelected}
        onContinueToTargetText={() => undefined}
        onCreate={() => undefined}
      />
    </Modal>
  );
};

const meta: Meta<typeof CreateRelationshipModal> = {
  title: 'EntityViewer/CreateRelationshipModal',
  component: CreateRelationshipModal,
};

type Story = StoryObj<typeof CreateRelationshipModal>;

const openModalPlay: Story['play'] = async ({ canvasElement }) => {
  canvasElement.querySelector('button')?.click();
};

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
  play: openModalPlay,
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

const EmptyTypes: Story = {
  render: () => (
    <RelationshipsStoryShell locale="en" relationshipTypes={[]} user={adminUser}>
      <>
        <ModalOpener />
        <CreateRelationshipModal />
      </>
    </RelationshipsStoryShell>
  ),
  play: openModalPlay,
};

const EmptyTypesEditor: Story = {
  render: () => (
    <RelationshipsStoryShell locale="en" relationshipTypes={[]} user={editorUser}>
      <>
        <ModalOpener />
        <CreateRelationshipModal />
      </>
    </RelationshipsStoryShell>
  ),
  play: openModalPlay,
};

const ChooseRelationType: Story = {
  render: () => (
    <RelationshipsStoryShell locale="en" user={adminUser}>
      <RelationTypeStepPreview />
    </RelationshipsStoryShell>
  ),
};

const ChooseRelationTypeEmpty: Story = {
  render: () => (
    <RelationshipsStoryShell locale="en" relationshipTypes={[]} user={adminUser}>
      <RelationTypeStepPreview />
    </RelationshipsStoryShell>
  ),
};

export {
  WithSelection,
  EntityLevel,
  EmptyTypes,
  EmptyTypesEditor,
  ChooseRelationType,
  ChooseRelationTypeEmpty,
};
export default meta;
