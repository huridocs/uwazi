import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { EntitySchema } from 'shared/types/entityType';
import { ClientSettings, ClientThesaurus, Template } from 'app/apiResponseTypes';
import { MetadataDisplay } from 'V2/Components/Metadata';
import { settingsAtom } from 'V2/atoms';
import { FluentCompositionBuilder, ProcessingContext } from 'V2/application';
import {
  rawEntity,
  processingContextBase,
  thesauri,
  templates,
  settings,
} from './fixtures/MetadataDisplayFixtures';

const store = createStore();
store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'] });

const MetadataDisplayComponent = ({
  dbEntity,
  context,
  contextThesauri,
  contextTemplates,
  contextSettings,
}: {
  dbEntity: EntitySchema;
  context: ProcessingContext;
  contextThesauri: ClientThesaurus[];
  contextTemplates: Template[];
  contextSettings: ClientSettings;
}) => {
  //This methods are meant to be used in loaders
  const fluentBuilder = FluentCompositionBuilder.create({
    ...context,
    thesauri: contextThesauri,
    templates: contextTemplates,
    settings: contextSettings,
  });
  const { entity } = fluentBuilder.forDetailView().processEntity(dbEntity);

  return (
    <div className="tw-content">
      <BrowserRouter>
        <Provider store={store}>
          <MetadataDisplay entity={entity} />
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
      dbEntity={args.dbEntity}
      context={args.context}
      contextThesauri={args.contextThesauri}
      contextTemplates={args.contextTemplates}
      contextSettings={args.contextSettings}
    />
  ),
};

const Basic = {
  ...Primary,
  args: {
    dbEntity: rawEntity,
    context: processingContextBase,
    contextThesauri: thesauri,
    contextTemplates: templates,
    contextSettings: settings,
  },
};

export { Basic };

export default meta;
