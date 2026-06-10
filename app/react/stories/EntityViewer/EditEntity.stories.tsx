import React from 'react';
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
import { apiEntity, templates, thesauri } from '../fixtures/EditEntityFixtures.js';
import { Translate } from '#app/I18N/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EditEntity } from '#V2/Components/Metadata/EntityEditor/index.js';
import { Button } from '#V2/Components/UI/index.js';

const EditEntityComponent = ({ entity, locale = 'en' }: { entity: Entity; locale?: string }) => {
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

  const handleSave = (savedEntity?: Entity) => {
    console.log('savedEntity:', savedEntity);
  };

  return (
    <div className="tw-content">
      <BrowserRouter>
        <Provider store={store}>
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
