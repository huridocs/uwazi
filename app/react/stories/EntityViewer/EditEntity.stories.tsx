import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  thesauriAtom,
  translationsAtom,
} from '#V2/atoms/index.js';
import { Translate } from '#app/I18N/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EditEntity } from '#V2/Components/Metadata/EntityEditor/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { MetadataEntityHeader } from '#V2/Components/Metadata/MetadataEntityHeader.js';
import { apiEntity, templates, thesauri } from '../fixtures/EditEntityFixtures.js';

const EditEntityComponent = ({ entity, locale = 'en' }: { entity: Entity; locale?: string }) => {
  const [savedEntity, setSavedEntity] = useState(entity);

  const store = createStore();
  store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'] });
  store.set(templatesAtom, templates);
  store.set(thesauriAtom, thesauri);
  store.set(localeAtom, locale);
  store.set(translationsAtom, [
    {
      locale: 'en',
      contexts: [
        {
          id: 'System',
          label: 'User Interface',
          type: 'Uwazi UI',
          values: {},
        },
      ],
    },
    {
      locale: 'es',
      contexts: [
        {
          id: 'System',
          label: 'User Interface',
          type: 'Uwazi UI',
          values: {},
        },
      ],
    },
  ]);

  const formId = 'edit-entity-form';

  const handleSave = (updatedEntity?: Entity) => {
    console.log(updatedEntity);
    if (updatedEntity) {
      setSavedEntity(updatedEntity);
    }
  };

  return (
    <div className="tw-content">
      <BrowserRouter>
        <Provider store={store}>
          <div className="flex gap-4">
            <div className="w-1/2">
              <p>Entity editor</p>
              <div className="mb-4">
                <EditEntity entity={entity} formId={formId} onSave={handleSave} />
              </div>
              <div className="flex flex-row items-center gap-2">
                <Button variant="secondary">
                  <Translate>Cancel</Translate>
                </Button>
                <Button variant="primary" type="submit" form={formId}>
                  <Translate>Save</Translate>
                </Button>
              </div>
            </div>
            <div className="w-1/2">
              <p>Entity view</p>
              <MetadataEntityHeader
                templateId={savedEntity.template}
                title={savedEntity.title}
                layout="inline"
              />
              <MetadataDisplay entity={savedEntity} />
            </div>
          </div>
        </Provider>
      </BrowserRouter>
    </div>
  );
};

const meta: Meta<typeof EditEntityComponent> = {
  title: 'EntityViewer/EditEntity',
  component: EditEntityComponent,
};

type Story = StoryObj<typeof EditEntityComponent>;

const Primary: Story = {
  render: args => <EditEntityComponent entity={args.entity} locale={args.locale} />,
};

const Basic: Story = {
  ...Primary,
  args: {
    entity: apiEntity,
    locale: 'en',
  },
};

export default meta;
export { Basic };
