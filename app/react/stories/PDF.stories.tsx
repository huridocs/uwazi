import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PDF } from 'V2/Components/PDFViewer';

const meta: Meta<typeof PDF> = {
  title: 'Viewers/PDF',
  component: PDF,
};

type Story = StoryObj<typeof PDF>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <div className="w-screen h-screen">
        <PDF fileUrl="/sample.pdf" />
      </div>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {},
};

export { Basic };

export default meta;
