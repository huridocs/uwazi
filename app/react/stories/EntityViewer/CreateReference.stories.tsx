import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { ClientRelationshipType } from '#app/apiResponseTypes.js';
import { CreateReference } from '#V2/Routes/Entity/Components/ReferencesPanel/CreateReference.js';
import { Entity } from '#V2/api/entities/types.js';
import { searchByTitle } from '#V2/api/entities/index.js';

// Mock PDF files
const mockPDFFile1 = {
  _id: 'file-1',
  filename: 'document1.pdf',
  originalname: 'Human Rights Document.pdf',
  mimetype: 'application/pdf',
  language: 'eng',
  totalPages: 25,
  type: 'document' as const,
};

const mockPDFFile2 = {
  _id: 'file-2',
  filename: 'document2.pdf',
  originalname: 'Legal Analysis.pdf',
  mimetype: 'application/pdf',
  language: 'spa',
  totalPages: 42,
  type: 'document' as const,
};

const mockPDFFile3 = {
  _id: 'file-3',
  filename: 'document3.pdf',
  originalname: 'Court Decision.pdf',
  mimetype: 'application/pdf',
  language: 'eng',
  totalPages: 18,
  type: 'document' as const,
};

// Mock entities for search results with files
const mockEntities: Entity[] = [
  {
    _id: '1',
    sharedId: 'shared-1',
    title: 'Document about Human Rights',
    language: 'en',
    template: 'template-1',
    creationDate: Date.now() - 86400000 * 30,
    user: 'user-1',
    metadata: {},
    documents: [mockPDFFile1],
  },
  {
    _id: '2',
    sharedId: 'shared-2',
    title: 'Legal Document Analysis',
    language: 'en',
    template: 'template-2',
    creationDate: Date.now() - 86400000 * 60,
    user: 'user-1',
    metadata: {},
    documents: [mockPDFFile2],
  },
  {
    _id: '3',
    sharedId: 'shared-3',
    title: 'Court Document Decision 2024',
    language: 'en',
    template: 'template-3',
    creationDate: Date.now() - 86400000 * 90,
    user: 'user-1',
    metadata: {},
    attachments: [mockPDFFile3],
  },
  {
    _id: '4',
    sharedId: 'shared-4',
    title: 'Official Document Submission',
    language: 'en',
    template: 'template-4',
    creationDate: Date.now() - 86400000 * 15,
    user: 'user-1',
    metadata: {},
  },
];

// Mock search function for Storybook
const mockSearchFunction = async (searchString: string): ReturnType<typeof searchByTitle> => {
  await new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, 300);
  });

  const filtered = mockEntities.filter(entity =>
    entity.title.toLowerCase().includes(searchString.toLowerCase())
  );

  return [filtered, undefined];
};

const meta: Meta<typeof CreateReference> = {
  title: 'EntityViewer/CreateReference',
  component: CreateReference,
};

type Story = StoryObj<typeof CreateReference>;

// Mock relationship types
const mockRelationshipTypes: ClientRelationshipType[] = [
  { _id: 'rel-1', name: 'Related to' },
  { _id: 'rel-2', name: 'Mentions' },
  { _id: 'rel-3', name: 'Cited in' },
  { _id: 'rel-4', name: 'Contradicts' },
];

// Mock text selection
const mockSelection: TextSelection = {
  text: 'This is a selected text from the document',
  selectionRectangles: [
    {
      top: 100,
      left: 50,
      width: 200,
      height: 20,
      regionId: '1',
    },
  ],
};

const Primary: Story = {
  render: args => (
    <div
      className="tw-content"
      style={{ width: '400px', height: '900px', border: '1px solid #ccc' }}
    >
      <CreateReference
        selection={args.selection}
        relationshipTypes={args.relationshipTypes}
        searchFunction={args.searchFunction}
        onSave={args.onSave}
        onCancel={args.onCancel}
      />
    </div>
  ),
};

const Default: Story = {
  ...Primary,
  args: {
    selection: mockSelection,
    relationshipTypes: mockRelationshipTypes,
    searchFunction: mockSearchFunction,
    onSave: data => {
      // eslint-disable-next-line no-alert
      alert(
        `Creating reference:\n- Target Entity: ${data.targetEntityId}\n- Relationship Type: ${data.relationshipType}`
      );
    },
    onCancel: () => {
      // eslint-disable-next-line no-alert
      alert('Create reference cancelled');
    },
  },
};

const EmptyRelationshipTypes: Story = {
  ...Primary,
  args: {
    selection: mockSelection,
    relationshipTypes: [],
    searchFunction: mockSearchFunction,
    onSave: () => undefined,
    onCancel: () => undefined,
  },
};

const LongSelection: Story = {
  ...Primary,
  args: {
    selection: {
      text: 'This is a very long selected text that spans multiple lines and contains a lot of information about the document and its contents.',
      selectionRectangles: [
        { top: 100, left: 50, width: 300, height: 60, regionId: '1' },
        { top: 170, left: 50, width: 300, height: 20, regionId: '1' },
      ],
    },
    relationshipTypes: mockRelationshipTypes,
    searchFunction: mockSearchFunction,
    onSave: () => undefined,
    onCancel: () => undefined,
  },
};

const TextMode: Story = {
  ...Primary,
  args: {
    selection: mockSelection,
    relationshipTypes: mockRelationshipTypes,
    searchFunction: mockSearchFunction,
    mode: 'text',
    onSave: data => {
      // eslint-disable-next-line no-alert
      alert(
        `Creating text reference:\n- Target Entity: ${data.targetEntityId}\n- Relationship Type: ${data.relationshipType}`
      );
    },
    onCancel: () => {
      // eslint-disable-next-line no-alert
      alert('Create reference cancelled');
    },
  },
};

export { Default, EmptyRelationshipTypes, LongSelection, TextMode };
// eslint-disable-next-line import/no-default-export
export default meta;
