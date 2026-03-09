import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { createStore, Provider } from 'jotai';
import { Entity } from '#V2/domain/index.js';
import { FileType } from '#shared/types/fileType.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { FileList } from '#V2/Routes/Entity/Components/FileList.js';

const store = createStore();
store.set(settingsAtom, { languages: [{ key: 'en', label: 'English' }] });

const meta: Meta<typeof FileList> = {
  title: 'Components/FileList',
  component: FileList,
};

export default meta;

type Story = StoryObj<typeof FileList>;

const Empty: Story = {
  render: () => {
    const mockEntity: Entity = {
      _id: 'entity1',
      sharedId: 'shared1',
      title: 'Test Entity',
      language: 'eng',
      creationDate: {
        _id: 'creationDate',
        name: 'creationDate',
        label: 'Date added',
        type: 'date',
        values: [{ value: Date.now(), label: new Date().toISOString() }],
      },
      editDate: {
        _id: 'editDate',
        name: 'editDate',
        label: 'Date modified',
        type: 'date',
        values: [{ value: Date.now(), label: new Date().toISOString() }],
      },
      metadata: [],
    };
    return (
      <div className="tw-content" style={{ height: '600px' }}>
        <Provider store={store}>
          <FileList entity={mockEntity} />
        </Provider>
      </div>
    );
  },
};

const WithFiles: Story = {
  render: () => {
    const mainDoc: FileType = {
      _id: 'main1',
      filename: 'main-document.pdf',
      language: 'eng',
      originalname: 'Main Document.pdf',
      mimetype: 'application/pdf',
      size: 1024000,
    };
    const doc: FileType = {
      _id: 'doc1',
      filename: 'document1.pdf',
      language: 'eng',
      originalname: 'Document 1.pdf',
      mimetype: 'application/pdf',
      size: 512000,
    };
    const attachment: FileType = {
      _id: 'att1',
      filename: 'attachment.zip',
      originalname: 'Attachment.zip',
      mimetype: 'application/zip',
      size: 2048000,
    };
    const mockEntity: Entity = {
      _id: 'entity1',
      sharedId: 'shared1',
      title: 'Test Entity',
      language: 'eng',
      creationDate: {
        _id: 'creationDate',
        name: 'creationDate',
        label: 'Date added',
        type: 'date',
        values: [{ value: Date.now(), label: new Date().toISOString() }],
      },
      editDate: {
        _id: 'editDate',
        name: 'editDate',
        label: 'Date modified',
        type: 'date',
        values: [{ value: Date.now(), label: new Date().toISOString() }],
      },
      metadata: [],
      mainDocument: [mainDoc],
      documents: [doc],
      attachments: [attachment],
    };
    return (
      <div className="tw-content" style={{ height: '600px' }}>
        <Provider store={store}>
          <FileList entity={mockEntity} />
        </Provider>
      </div>
    );
  },
};

export { Empty, WithFiles };
