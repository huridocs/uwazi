import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Geolocation } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Provider } from 'react-redux';

const meta: Meta<typeof Geolocation> = {
  title: 'Forms/Geolocation',
  component: Geolocation,
  argTypes: {
    onChange: { action: 'changed' },
  },
};

type Story = StoryObj<typeof Geolocation>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <div className="tw-content">
        <Geolocation
          label={args.label}
          name={args.name}
          onChange={args.onChange}
          className={args.className}
          value={args.value}
          disabled={args.disabled}
          zoom={args.zoom}
          layers={args.layers}
        />
      </div>
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    label: 'Uwazi is everywhere',
    name: 'Uwazilocations',
    disabled: false,
    className: '',
    value: { lat: 0, lon: 0 },
    onChange: action('changed'),
    zoom: 2,
    layers: ['Dark', 'Satellite'],
  },
};

export { Basic };

export default meta;
