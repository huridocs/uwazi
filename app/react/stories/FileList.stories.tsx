import React from 'react';
import preview from '#storybook/preview';
import { createStore, Provider } from 'jotai';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { FileList } from '#V2/Routes/Entity/Components/shared/index.js';
import { Entity } from '#app/V2/api/entities/types.js';

const store = createStore();
store.set(settingsAtom, { languages: [{ key: 'en', label: 'English' }] });
store.set(templatesAtom, [{ _id: 'template1', name: 'Template 1', properties: [] }] as any);

const meta = preview.meta({
  title: 'Components/FileList',
  component: FileList,
});

const Empty = meta.story({
  render: () => {
    const mockEntity: Entity = {
      _id: 'entity1',
      sharedId: 'shared1',
      template: 'template1',
      title: 'Test Entity',
      language: 'eng',
      user: 'user1',
      creationDate: 1,
      editDate: 2,
      metadata: {},
    };
    return (
      <div className="tw-content" style={{ height: '600px' }}>
        <Provider store={store}>
          <FileList entity={mockEntity} />
        </Provider>
      </div>
    );
  },
});

const WithFiles = meta.story({
  render: () => {
    const mockEntity: Entity = {
      _id: 'entity1',
      sharedId: 'shared1',
      template: 'template1',
      title: 'Test Entity',
      language: 'eng',
      user: 'user1',
      creationDate: Date.now(),
      editDate: Date.now(),
      metadata: {},
      documents: [
        {
          _id: 'main1',
          filename: 'main-document.pdf',
          language: 'eng',
          originalname: 'Main Document.pdf',
          mimetype: 'application/pdf',
          size: 1024000,
        },
      ],
      attachments: [
        {
          _id: 'att1',
          filename: 'attachment.zip',
          originalname: 'Attachment.zip',
          mimetype: 'application/zip',
          size: 2048000,
        },
      ],
    };
    return (
      <div className="tw-content" style={{ height: '600px' }}>
        <Provider store={store}>
          <FileList entity={mockEntity} />
        </Provider>
      </div>
    );
  },
});
export { Empty, WithFiles };
