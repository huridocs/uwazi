import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
import { EnableButtonCheckbox } from '../../V2/Components/Forms.js';

const meta: Meta<typeof EnableButtonCheckbox> = {
  title: 'Forms/EnableButtonCheckbox',
  component: EnableButtonCheckbox,
};

type Story = StoryObj<typeof EnableButtonCheckbox>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <EnableButtonCheckbox
        // @ts-expect-error TS(2339): Property 'disabled' does not exist on type '{}'.
        disabled={args.disabled}
        // @ts-expect-error TS(2339): Property 'name' does not exist on type '{}'.
        name={args.name}
        // @ts-expect-error TS(2339): Property 'defaultChecked' does not exist on type '... Remove this comment to see the full error message
        defaultChecked={args.defaultChecked}
        // @ts-expect-error TS(2339): Property 'onChange' does not exist on type '{}'.
        onChange={args.onChange}
      />
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    name: 'option',
    disabled: false,
    defaultChecked: false,
    onChange: () => {},
  },
};

export { Basic };

export default meta;
