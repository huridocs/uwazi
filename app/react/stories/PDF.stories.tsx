import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { PDF } from 'V2/Components/PDFViewer';

const meta: Meta<typeof PDF> = {
  title: 'Viewers/PDF',
  component: PDF,
};

type Story = StoryObj<typeof PDF>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <div className="tw-content">
        <PDF fileUrl="/sample.pdf" onSelect={args.onSelect} onDeselect={args.onDeselect} />
      </div>
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    onSelect: () => {},
    onDeselect: () => {},
  },
};

export { Basic };

export default meta;
