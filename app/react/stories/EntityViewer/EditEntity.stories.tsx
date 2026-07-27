/* eslint-disable max-lines */
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
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
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import { EditEntity, type EditEntityErrors } from '#V2/Components/Metadata/EntityEditor/index.js';
import {
  buildEditEntityDefaultValues,
  type EditEntityFormValues,
} from '#V2/Components/Metadata/EntityEditor/functions/buildEditEntityDefaultValues.js';
import { useEntityMediaUpload } from '#V2/Components/Metadata/EntityEditor/hooks/useEntityMediaUpload.js';
import { Button } from '#V2/Components/UI/index.js';
import { apiEntity, templates, thesauri } from '../fixtures/EditEntityFixtures.js';

const newEntity: Entity = {
  ...apiEntity,
  title: '',
  metadata: {
    related_residents: [],
  },
};

const allRequiredTemplates = templates.map(template => ({
  ...template,
  properties: template.properties?.map(property => ({
    ...property,
    required: true,
  })),
}));

const EditEntityComponent = ({
  entity,
  onSave,
  locale = 'en',
  relationshipLookup,
  templatesForStory = templates,
  errors,
}: {
  entity: Entity;
  onSave: (savedEntity: EntitySaveInput) => void;
  locale?: string;
  templatesForStory?: typeof templates;
  errors?: EditEntityErrors;
  relationshipLookup?: (params: {
    search: string;
    template?: string;
    limit?: number;
  }) => Promise<{ value: string; label: string }[]>;
}) => {
  const [savedEntity, setSavedEntity] = useState<Entity | EntitySaveInput>(entity);
  const form = useForm<EditEntityFormValues>({
    defaultValues: buildEditEntityDefaultValues(entity, templatesForStory),
  });
  const templateId = form.watch('template');
  const mediaUpload = useEntityMediaUpload(entity, templateId);

  const store = createStore();
  store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'] });
  store.set(templatesAtom, templatesForStory);
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
  const mockedRelationshipLookup = async ({
    search,
    template,
  }: {
    search: string;
    template?: string;
  }) => {
    const peopleTemplateOptions = [
      { value: 'entity2', label: 'Maria Rodriguez - Witness' },
      { value: 'entity3', label: 'John Smith - Reporter' },
      { value: 'entity4', label: 'Ana Diaz - Observer' },
      { value: 'entity5', label: 'Pedro Alvarez - Analyst' },
      { value: 'entity6', label: 'Lucia Torres - Resident' },
      { value: 'entity7', label: 'Carlos Mejia - Resident' },
      { value: 'entity8', label: 'Elena Pardo - Resident' },
      { value: 'entity9', label: 'Sofia Herrera - Resident' },
      { value: 'entity10', label: 'Diego Morales - Resident' },
      { value: 'entity11', label: 'Mateo Cruz - Resident' },
      { value: 'entity12', label: 'Paula Castillo - Resident' },
      { value: 'entity13', label: 'Nora Delgado - Resident' },
      { value: 'entity14', label: 'Raul Arias - Resident' },
      { value: 'entity15', label: 'Marta Ibarra - Resident' },
      { value: 'entity16', label: 'Julian Soto - Resident' },
      { value: 'entity17', label: 'Valeria Acosta - Resident' },
      { value: 'entity18', label: 'Rene Vargas - Resident' },
      { value: 'entity19', label: 'Irene Salas - Resident' },
      { value: 'entity20', label: 'Felipe Navarro - Resident' },
      { value: 'entity21', label: 'Camila Ruiz - Resident' },
      { value: 'entity22', label: 'Rosa Benitez - Resident' },
      { value: 'entity23', label: 'Alberto Vera - Resident' },
      { value: 'entity24', label: 'Daniela Ponce - Resident' },
      { value: 'entity25', label: 'Jorge Mena - Resident' },
      { value: 'entity26', label: 'Adriana Leon - Resident' },
      { value: 'entity27', label: 'Bruno Reyes - Resident' },
      { value: 'entity28', label: 'Patricia Cardenas - Resident' },
      { value: 'entity29', label: 'Ricardo Flores - Resident' },
      { value: 'entity30', label: 'Marina Lopez - Resident' },
      { value: 'entity31', label: 'Gustavo Silva - Resident' },
    ];

    if (template !== 'template2') {
      return [];
    }

    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return peopleTemplateOptions;
    }

    return peopleTemplateOptions.filter(option =>
      option.label.toLowerCase().includes(normalizedSearch)
    );
  };

  const handleSave = (updatedEntity: EntitySaveInput) => {
    onSave?.(updatedEntity);
    setSavedEntity(updatedEntity);
  };

  return (
    <div className="tw-content">
      <BrowserRouter>
        <Provider store={store}>
          <div className="border rounded p-4 bg-(--bg-surface) text-ink mb-2">
            <h2 className="text-lg font-bold py-2">Entity editor</h2>
            <div className="mb-4">
              {}
              <FormProvider {...form}>
                <EditEntity
                  entity={entity}
                  formId={formId}
                  form={form}
                  mediaUpload={mediaUpload}
                  onSave={handleSave}
                  errors={errors}
                  relationshipLookup={relationshipLookup ?? mockedRelationshipLookup}
                />
              </FormProvider>
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
    <EditEntityComponent
      onSave={args.onSave}
      entity={args.entity}
      locale={args.locale}
      templatesForStory={args.templatesForStory}
      errors={args.errors}
      relationshipLookup={args.relationshipLookup}
    />
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

const New: Story = {
  ...Primary,
  args: {
    entity: newEntity,
    locale: 'en',
    onSave: undefined,
  },
};

const AllRequired: Story = {
  ...Primary,
  args: {
    entity: newEntity,
    locale: 'en',
    templatesForStory: allRequiredTemplates,
    onSave: undefined,
  },
};

const WithExternalErrors: Story = {
  ...Primary,
  args: {
    entity: apiEntity,
    locale: 'en',
    errors: {
      title: 'The title already exists',
      metadata: {
        simple_text: 'This value is invalid',
        related_people: 'This relationship is not allowed',
        external_link: 'Please provide a valid source URL',
      },
    },
    onSave: undefined,
  },
};

export default meta;
export { Basic, New, AllRequired, WithExternalErrors };
