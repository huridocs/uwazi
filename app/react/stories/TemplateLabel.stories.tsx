import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { TemplateLabel } from '#app/V2/Components/Metadata/Components/index.js';

const meta: Meta<typeof TemplateLabel> = {
  title: 'Components/Metadata/TemplateLabel',
  component: TemplateLabel,
};

type Story = StoryObj<typeof TemplateLabel>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <TemplateLabel template={args.template} />
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    template: {
      _id: 'template-case',
      name: 'Case',
      color: '#A4CAFE',
    },
  },
};

const LightBlue: Story = {
  ...Primary,
  args: {
    template: {
      _id: 'template-light-blue',
      name: 'Case',
      color: '#BDD7F5',
    },
  },
};

const Red: Story = {
  ...Primary,
  args: {
    template: {
      _id: 'template-red',
      name: 'Order of the judge',
      color: '#F5BDBD',
    },
  },
};

const Purple: Story = {
  ...Primary,
  args: {
    template: {
      _id: 'template-purple',
      name: 'IACourt Judge',
      color: '#D7BDF5',
    },
  },
};

const Dark: Story = {
  ...Primary,
  args: {
    template: {
      _id: 'template-dark',
      name: 'Dark Template',
      color: '#2F0F06',
    },
  },
};

const Green: Story = {
  ...Primary,
  args: {
    template: {
      _id: 'template-green',
      name: 'Green Template',
      color: '#BDF5BD',
    },
  },
};

export default meta;
export { Basic, LightBlue, Red, Purple, Dark, Green };
