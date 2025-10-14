import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { MetadataDisplay } from 'V2/Components/Metadata';
import { settingsAtom } from 'V2/atoms';
import { FluentCompositionBuilder } from 'V2/application/FluentCompositionBuilder';
import { rawEntity, processingContext } from './fixtures/MetadataDisplayFixtures';

const store = createStore();
store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'] });

const meta: Meta<typeof MetadataDisplay> = {
  title: 'Components/Metadata',
  component: MetadataDisplay,
};

type Story = StoryObj<typeof MetadataDisplay>;

const fluentBuilder = FluentCompositionBuilder.create(processingContext);
const { entity } = fluentBuilder.forDetailView().processEntity(rawEntity);

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <BrowserRouter>
        <Provider store={store}>
          <MetadataDisplay entity={args.entity} />
        </Provider>
      </BrowserRouter>
    </div>
  ),
};

const Basic = {
  ...Primary,
  args: { entity },
};

export { Basic };

export default meta;
