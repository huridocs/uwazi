import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
import { FileDropzone } from '../../V2/Components/Forms.js';

const meta: Meta<typeof FileDropzone> = {
  title: 'Forms/FileDropzone',
  component: FileDropzone,
};

type Story = StoryObj<typeof FileDropzone>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      // @ts-expect-error TS(2339): Property 'onDrop' does not exist on type '{}'.
      <FileDropzone className="w-1/2" onDrop={args.onDrop} onChange={args.onChange} />
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    // @ts-expect-error TS(7006): Parameter '_files' implicitly has an 'any' type.
    onDrop: _files => {},
    // @ts-expect-error TS(7006): Parameter '_files' implicitly has an 'any' type.
    onChange: _files => {},
  },
};

export { Basic };

export default meta;
