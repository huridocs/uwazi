import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';
import { RadioSelect } from '#V2/Components/Forms/index.js';

const meta = preview.meta({
  title: 'Forms/RadioSelect',
  component: RadioSelect,
  args: {
    onChange: fn(),
  },
});

const Primary = meta.story({
  args: {
    legend: 'Choose your favorite country',
    name: 'country',
    options: [
      {
        id: 'united-state',
        label: 'USA',
        value: 'united-state',
      },
      { label: 'Germany', value: 'germany' },
      {
        id: 'spain',
        label: 'Spain',
        value: 'spain',
        defaultChecked: true,
      },
      {
        id: 'uk',
        label: 'United Kingdom',
        value: 'uk',
        disabled: true,
      },
      { id: 'china', label: 'China', value: 'china' },
    ],
    onChange: fn(),
  },
  render: args => (
    <div className="tw-content">
      <RadioSelect
        legend={args.legend}
        options={args.options}
        name={args.name}
        onChange={args.onChange}
        orientation={args.orientation}
      />
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    legend: 'Choose your favorite country',
    name: 'country',
    options: [
      {
        id: 'united-state',
        label: 'USA',
        value: 'united-state',
      },
      { label: 'Germany', value: 'germany' },
      {
        id: 'spain',
        label: 'Spain',
        value: 'spain',
        defaultChecked: true,
      },
      {
        id: 'uk',
        label: 'United Kingdom',
        value: 'uk',
        disabled: true,
      },
      { id: 'china', label: 'China', value: 'china' },
    ],
    onChange: action('changed'),
  },
});

const Horizontal = storyExtend(Primary, {
  args: {
    ...Basic.composed.args,
    orientation: 'horizontal',
  },
});

export { Basic, Horizontal };
