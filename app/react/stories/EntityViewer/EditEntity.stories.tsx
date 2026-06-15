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
import { apiEntity, templates, thesauri } from '../fixtures/EditEntityFixtures.js';

const EditEntityComponent = ({
  entity,
  onSave,
  locale = 'en',
}: {
  entity: Entity;
  onSave: (savedEntity: Entity) => void;
  locale?: string;
}) => {
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
    if (updatedEntity) {
      onSave?.(updatedEntity);
      setSavedEntity(updatedEntity);
    }
  };

  return (
    <div className="tw-content">
      <BrowserRouter>
        <Provider store={store}>
          <div className="border rounded p-4 bg-(--bg-surface) text-ink mb-2">
            <h2 className="text-lg font-bold py-2">Entity editor</h2>
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
          <div className="border rounded p-4 bg-(--bg-surface) text-ink mt-2">
            <h2 className="text-lg font-bold py-2">Saved entity</h2>
            <pre data-testid="resulting-entity">{JSON.stringify(savedEntity, null, 2)}</pre>
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
  render: args => (
    <EditEntityComponent onSave={args.onSave} entity={args.entity} locale={args.locale} />
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    entity: apiEntity,
    locale: 'en',
    onSave: undefined,
  },
};

export default meta;
export { Basic };
