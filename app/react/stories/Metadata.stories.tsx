import React, { useMemo } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { localeAtom, settingsAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { apiEntity, templates } from './fixtures/MetadataDisplayFixtures.js';
import { Entity, MetadataSchema } from '#V2/api/entities/types.js';

const MetadataDisplayComponent = ({
  entity,
  showGeolocationProperties,
  locale = 'en',
}: {
  entity: Entity;
  showGeolocationProperties: boolean;
  locale?: string;
}) => {
  const store = createStore();
  store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'] });
  store.set(templatesAtom, templates);
  store.set(localeAtom, locale);
  store.set(translationsAtom, [
    {
      locale: 'en',
      contexts: [
        {
          id: 'System',
          label: 'User Interface',
          type: 'Uwazi UI',
          values: { 'Grouped geolocation properties': 'Grouped geolocation properties' },
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
          values: { 'Grouped geolocation properties': 'Propiedades agrupadas de geolocalización' },
        },
      ],
    },
  ]);

  //Storybook cannot understand relative paths to api/files
  const storyReadyEntity = useMemo<Entity>(() => {
    if (!entity.metadata) {
      return entity;
    }

    const template = templates.find(currentTemplate => currentTemplate._id === entity.template);
    const hiddenGeolocationProperties = new Set(
      showGeolocationProperties
        ? []
        : (template?.properties ?? [])
            .filter(property => property.type === 'geolocation')
            .map(property => property.name)
    );

    const metadata = Object.entries(entity.metadata).reduce<MetadataSchema>(
      (acc, [name, values]) => {
        if (!values || hiddenGeolocationProperties.has(name)) {
          return acc;
        }

        acc[name] = values.map(value =>
          typeof value.value === 'string'
            ? { ...value, value: value.value.replace('/api/files', '') }
            : value
        );

        return acc;
      },
      {}
    );

    return { ...entity, metadata };
  }, [entity, showGeolocationProperties]);

  return (
    <div className="tw-content">
      <BrowserRouter>
        <Provider store={store}>
          <MetadataDisplay entity={storyReadyEntity} />
        </Provider>
      </BrowserRouter>
    </div>
  );
};

const meta: Meta<typeof MetadataDisplayComponent> = {
  title: 'Components/Metadata',
  component: MetadataDisplayComponent,
};

type Story = StoryObj<typeof MetadataDisplayComponent>;

const Primary: Story = {
  render: args => (
    <MetadataDisplayComponent
      entity={args.entity}
      showGeolocationProperties={args.showGeolocationProperties}
      locale={args.locale}
    />
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    entity: apiEntity,
    showGeolocationProperties: true,
    locale: 'en',
  },
};

export default meta;
export { Basic };
