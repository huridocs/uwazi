import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
import { RadioSelect } from '../../V2/Components/Forms.js';

const meta: Meta<typeof RadioSelect> = {
  title: 'Forms/RadioSelect',
  component: RadioSelect,
  args: {
    onChange: fn(),
  },
};

type Story = StoryObj<typeof RadioSelect>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <RadioSelect
        // @ts-expect-error TS(2339): Property 'legend' does not exist on type '{}'.
        legend={args.legend}
        // @ts-expect-error TS(2339): Property 'options' does not exist on type '{}'.
        options={args.options}
        // @ts-expect-error TS(2339): Property 'name' does not exist on type '{}'.
        name={args.name}
        // @ts-expect-error TS(2339): Property 'onChange' does not exist on type '{}'.
        onChange={args.onChange}
        // @ts-expect-error TS(2339): Property 'orientation' does not exist on type '{}'... Remove this comment to see the full error message
        orientation={args.orientation}
      />
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
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
};

const Horizontal: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    orientation: 'horizontal',
  },
};

export { Basic, Horizontal };

export default meta;
