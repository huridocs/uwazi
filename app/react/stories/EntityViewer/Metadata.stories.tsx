import React, { useMemo } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { MetadataRecord } from '#V2/Components/Metadata/MetadataRecord.js';
import { MetadataDisplayFooter } from '#app/V2/Routes/Entity/Components/index.js';
import { MetadataEditingProvider } from '#V2/Routes/Entity/Components/context/MetadataEditingContext.js';
import { EntityScopedProvider } from '#V2/Routes/Entity/Components/context/index.js';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { Entity, MetadataSchema } from '#V2/api/entities/types.js';
import { apiEntity, templates } from '../fixtures/MetadataDisplayFixtures.js';

type ViewMode = 'masonry' | 'record';

const MetadataStoryShell = ({
  entity,
  showGeolocationProperties,
  locale = 'en',
  view = 'masonry',
}: {
  entity: Entity;
  showGeolocationProperties: boolean;
  locale?: string;
  view?: ViewMode;
}) => {
  const store = createStore();
  store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'] });
  store.set(templatesAtom, templates);
  store.set(localeAtom, locale);
  store.set(userAtom, { _id: 'admin1', role: 'admin', email: 'admin@uwazi.io', username: 'admin' });
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

  const ReadView = view === 'record' ? MetadataRecord : MetadataDisplay;

  return (
    <div className="tw-content">
      <BrowserRouter>
        <Provider store={store}>
          <EntityScopedProvider
            key={storyReadyEntity.sharedId}
            entity={storyReadyEntity}
            language={storyReadyEntity.language ?? 'en'}
          >
            <MetadataEditingProvider>
              <Panel>
                <Panel.Body>
                  <ReadView entity={storyReadyEntity} />
                </Panel.Body>
                <Panel.Footer>
                  <MetadataDisplayFooter host="main" />
                </Panel.Footer>
              </Panel>
            </MetadataEditingProvider>
          </EntityScopedProvider>
        </Provider>
      </BrowserRouter>
    </div>
  );
};

const meta: Meta<typeof MetadataStoryShell> = {
  title: 'EntityViewer/MedataDisplay',
  component: MetadataStoryShell,
};

type Story = StoryObj<typeof MetadataStoryShell>;

const Primary: Story = {
  render: args => (
    <MetadataStoryShell
      entity={args.entity}
      showGeolocationProperties={args.showGeolocationProperties}
      locale={args.locale}
      view={args.view}
    />
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    entity: apiEntity,
    showGeolocationProperties: true,
    locale: 'en',
    view: 'masonry',
  },
};

const CompactRecord: Story = {
  ...Primary,
  args: {
    entity: apiEntity,
    showGeolocationProperties: true,
    locale: 'en',
    view: 'record',
  },
};

export default meta;
export { Basic, CompactRecord };
