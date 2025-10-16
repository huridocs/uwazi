import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { EntitySchema } from 'shared/types/entityType';
import { MetadataDisplay } from 'V2/Components/Metadata';
import { settingsAtom } from 'V2/atoms';
import { FluentCompositionBuilder } from 'V2/application';
import { rawEntity, processingContext } from './fixtures/MetadataDisplayFixtures';

const store = createStore();
store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'] });

const fluentBuilder = FluentCompositionBuilder.create(processingContext);

const MetadataDisplayComponent = ({ dbEntity }: { dbEntity: EntitySchema }) => {
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
  render: args => <MetadataDisplayComponent dbEntity={args.dbEntity} />,
};

const Basic = {
  ...Primary,
  args: { dbEntity: rawEntity },
};

export { Basic };

export default meta;
