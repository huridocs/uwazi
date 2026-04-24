import React, { useMemo } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { localeAtom, settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { apiEntity, templates } from './fixtures/MetadataDisplayFixtures.js';
import { Entity, MetadataSchema } from '#V2/api/entities/types.js';

const MetadataDisplayComponent = ({
  entity,
  showGeolocationProperties,
  locale = 'en',
  dateFormat = 'yyyy-MM-dd',
}: {
  entity: Entity;
  showGeolocationProperties: boolean;
  locale?: string;
  dateFormat?: string;
}) => {
  const store = createStore();
  store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'], dateFormat });
  store.set(templatesAtom, templates);
  store.set(localeAtom, locale);

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
      dateFormat={args.dateFormat}
    />
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    entity: apiEntity,
    showGeolocationProperties: true,
    locale: 'en',
    dateFormat: 'yyyy-MM-dd',
  },
};

export default meta;
export { Basic };
