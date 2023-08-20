import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { PDF } from 'V2/Components/PDFViewer';
import { highlights } from './fixtures/PDFStoryFixtures';

const meta: Meta<typeof PDF> = {
  title: 'Viewers/PDF',
  component: PDF,
  argTypes: { onSelect: { action: 'selected' }, onDeselect: { action: 'unselected' } },
};

type Story = StoryObj<typeof PDF>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <div className="tw-content" style={{ height: '1000px', width: 'auto' }}>
        <PDF
          fileUrl="/sample.pdf"
          onSelect={args.onSelect}
          onDeselect={args.onDeselect}
          highlights={args.highlights}
          scrollToPage={args.scrollToPage}
          size={{ height: 1000, width: 'auto' }}
        />
      </div>
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
};

const WithSelections: Story = {
  ...Primary,
  args: {
    highlights,
  },
};

const WithScroll: Story = {
  ...Primary,
  args: {
    scrollToPage: '3',
  },
};

export { Basic, WithSelections, WithScroll };

export default meta;
