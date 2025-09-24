import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
import { Geolocation } from '../../V2/Components/Forms.js';
import { LEGACY_createStore as createStore } from '../../V2/testing/index.js';
import { Provider } from 'react-redux';

const meta: Meta<typeof Geolocation> = {
  title: 'Forms/Geolocation',
  component: Geolocation,
  args: {
    onChange: fn(),
  },
};

type Story = StoryObj<typeof Geolocation>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <div className="tw-content">
        <Geolocation
          // @ts-expect-error TS(2339): Property 'label' does not exist on type '{}'.
          label={args.label}
          // @ts-expect-error TS(2339): Property 'name' does not exist on type '{}'.
          name={args.name}
          // @ts-expect-error TS(2339): Property 'onChange' does not exist on type '{}'.
          onChange={args.onChange}
          // @ts-expect-error TS(2339): Property 'className' does not exist on type '{}'.
          className={args.className}
          // @ts-expect-error TS(2339): Property 'value' does not exist on type '{}'.
          value={args.value}
          // @ts-expect-error TS(2339): Property 'disabled' does not exist on type '{}'.
          disabled={args.disabled}
          // @ts-expect-error TS(2339): Property 'zoom' does not exist on type '{}'.
          zoom={args.zoom}
          // @ts-expect-error TS(2339): Property 'layers' does not exist on type '{}'.
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
