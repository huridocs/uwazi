import React from 'react';
import preview from '#storybook/preview';
import { DatavizEditor } from '#V2/Dataviz/editor/DatavizEditor.js';
import {
  createCustomColorsDefinition,
  createDefaultDatavizDefinition,
  createEmptyDatavizDefinition,
  createMultiSourceDefinition,
  createPersonasSexByCountryDefinition,
  createWithFiltersDefinition,
} from '../fixtures/datavizFixtures.js';
import { DatavizStoryProvider } from '../providers/DatavizStoryProvider.js';

const meta = preview.meta({
  title: 'Settings/DatavizEditor',
  component: DatavizEditor,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => (
      <DatavizStoryProvider apiOptions={context.parameters.apiOptions}>
        <Story />
      </DatavizStoryProvider>
    ),
  ],
});

export const Default = meta.story({
  args: {
    initialDefinition: createDefaultDatavizDefinition(),
  },
});

export const PersonasSexByCountry = meta.story({
  args: {
    initialDefinition: createPersonasSexByCountryDefinition(),
  },
});

export const MultiSource = meta.story({
  args: {
    initialDefinition: createMultiSourceDefinition(),
  },
});

export const WithFilters = meta.story({
  args: {
    initialDefinition: createWithFiltersDefinition(),
  },
});

export const CustomColors = meta.story({
  args: {
    initialDefinition: createCustomColorsDefinition(),
  },
});

export const LoadingPreview = meta.story({
  parameters: {
    apiOptions: { dataDelayMs: 3000 },
  },
  args: {
    initialDefinition: createDefaultDatavizDefinition(),
  },
});

export const New = meta.story({
  args: {
    initialDefinition: createEmptyDatavizDefinition(),
  },
});
