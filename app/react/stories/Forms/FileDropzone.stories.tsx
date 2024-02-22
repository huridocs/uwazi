import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { FileDropzone } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Provider } from 'react-redux';

const meta: Meta<typeof FileDropzone> = {
  title: 'Forms/FileDropzone',
  component: FileDropzone,
};

type Story = StoryObj<typeof FileDropzone>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <div className="tw-content">
        <FileDropzone />
      </div>
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {},
};

export { Basic };

export default meta;
