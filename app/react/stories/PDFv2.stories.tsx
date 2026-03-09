import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PDF } from '#V2/Components/PDFViewer.v2/PDF.js';

const meta: Meta<typeof PDF> = {
  title: 'Viewers/PDF v2',
  component: PDF,
  args: {
    fileUrl: '/sample.pdf',
    className: 'tw-h-[80vh] tw-w-full',
  },
};

type Story = StoryObj<typeof PDF>;

const PdfStoryContent: React.FC<React.ComponentProps<typeof PDF>> = args => (
  <div className="tw-content">
    <PDF
      {...args}
      onDeselect={() => {
        console.log('cleared');
      }}
      onSelect={selection => console.log(selection)}
      onDocumentLoaded={() => {
        console.log('document loaded');
      }}
      onEventBusReady={() => {
        console.log('event bus ready');
      }}
      onPageChanged={page => {
        console.log('changed to page: ', page);
      }}
      onPageRendered={page => {
        console.log('rendered page: ', page);
      }}
    />
  </div>
);

const Primary: Story = {
  render: args => <PdfStoryContent {...args} />,
};

const Basic: Story = {
  ...Primary,
};

export { Basic };
export default meta;
