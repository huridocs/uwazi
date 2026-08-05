import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
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

const meta: Meta<typeof DatavizEditor> = {
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
};

export default meta;

type Story = StoryObj<typeof DatavizEditor>;

export const Default: Story = {
  args: {
    initialDefinition: createDefaultDatavizDefinition(),
  },
};

export const PersonasSexByCountry: Story = {
  args: {
    initialDefinition: createPersonasSexByCountryDefinition(),
  },
};

export const MultiSource: Story = {
  args: {
    initialDefinition: createMultiSourceDefinition(),
  },
};

export const WithFilters: Story = {
  args: {
    initialDefinition: createWithFiltersDefinition(),
  },
};

export const CustomColors: Story = {
  args: {
    initialDefinition: createCustomColorsDefinition(),
  },
};

export const LoadingPreview: Story = {
  parameters: {
    apiOptions: { dataDelayMs: 3000 },
  },
  args: {
    initialDefinition: createDefaultDatavizDefinition(),
  },
};

export const New: Story = {
  args: {
    initialDefinition: createEmptyDatavizDefinition(),
  },
};
