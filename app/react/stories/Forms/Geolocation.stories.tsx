import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';
import { Geolocation } from '#V2/Components/Forms/index.js';
import { LEGACY_createStore as createStore } from '#V2/testing/index.js';
import { Provider } from 'react-redux';

const meta = preview.meta({
  title: 'Forms/Geolocation',
  component: Geolocation,
  args: {
    onChange: fn(),
  },
});

const Primary = meta.story({
  args: {
    label: 'Uwazi is everywhere',
    name: 'Uwazilocations',
    disabled: false,
    className: '',
    value: { lat: 0, lon: 0 },
    onChange: fn(),
    zoom: 2,
    layers: ['Dark', 'Satellite'],
  },
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
});

const Basic = storyExtend(Primary, {
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
});

export { Basic };
