import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { createStore, Provider } from 'jotai';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { templatesAtom } from '#V2/atoms/index.js';

const templates = [
  {
    _id: 'template-case',
    name: 'Case',
    color: '#A4CAFE',
  },
  {
    _id: 'template-light-blue',
    name: 'Case',
    color: '#BDD7F5',
  },
  {
    _id: 'template-red',
    name: 'Order of the judge',
    color: '#F5BDBD',
  },
  {
    _id: 'template-purple',
    name: 'IACourt Judge',
    color: '#D7BDF5',
  },
  {
    _id: 'template-dark',
    name: 'Dark Template',
    color: '#2F0F06',
  },
  {
    _id: 'template-green',
    name: 'Green Template',
    color: '#BDF5BD',
  },
];

const store = createStore();
store.set(templatesAtom, templates);

const meta: Meta<typeof TemplateLabel> = {
  title: 'Metadata/TemplateLabel',
  component: TemplateLabel,
};

type Story = StoryObj<typeof TemplateLabel>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Provider store={store}>
        <TemplateLabel templateId={args.templateId} />
      </Provider>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    templateId: 'template-case',
  },
};

const LightBlue: Story = {
  ...Primary,
  args: {
    templateId: 'template-light-blue',
  },
};

const Red: Story = {
  ...Primary,
  args: {
    templateId: 'template-red',
  },
};

const Purple: Story = {
  ...Primary,
  args: {
    templateId: 'template-purple',
  },
};

const Dark: Story = {
  ...Primary,
  args: {
    templateId: 'template-dark',
  },
};

const Green: Story = {
  ...Primary,
  args: {
    templateId: 'template-green',
  },
};

export default meta;
export { Basic, LightBlue, Red, Purple, Dark, Green };
