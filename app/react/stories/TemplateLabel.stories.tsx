import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { TemplateLabel } from '#V2/Components/Metadata/TemplateLabel.js';

const meta: Meta<typeof TemplateLabel> = {
  title: 'Components/Metadata/TemplateLabel',
  component: TemplateLabel,
};
export default meta;

type Story = StoryObj<typeof TemplateLabel>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <TemplateLabel label={args.label} templateId={args.templateId} color={args.color} />
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    label: 'Case',
    color: '#A4CAFE',
  },
};

const LightBlue: Story = {
  ...Primary,
  args: {
    label: 'Case',
    color: '#BDD7F5',
  },
};

const Red: Story = {
  ...Primary,
  args: {
    label: 'Order of the judge',
    color: '#F5BDBD',
  },
};

const Purple: Story = {
  ...Primary,
  args: {
    label: 'IACourt Judge',
    color: '#D7BDF5',
  },
};

const Dark: Story = {
  ...Primary,
  args: {
    label: 'Dark Template',
    color: '#2F0F06',
  },
};

const Green: Story = {
  ...Primary,
  args: {
    label: 'Green Template',
    color: '#BDF5BD',
  },
};

export { Basic, LightBlue, Red, Purple, Dark, Green };
