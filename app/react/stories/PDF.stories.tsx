import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { PDF, PDFControls } from '#V2/Components/PDFViewer/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { highlights } from './fixtures/PDFStoryFixtures.js';

const meta: Meta<typeof PDF> = {
  title: 'Viewers/PDF',
  component: PDF,
  args: { onSelect: fn(), onDeselect: fn() },
};

type Story = StoryObj<typeof PDF>;

const PdfStoryContent: React.FC<React.ComponentProps<typeof PDF>> = args => {
  const pdfControlsRef = useRef<PDFControls | null>(null);
  const [currentScale, setCurrentScale] = useState(1);
  const [currentPage, setCurrentPage] = useState<string | null>('1');
  const [lastSelection, setLastSelection] = useState<TextSelection | null>(null);
  const [snippetText, setSnippetText] = useState('');

  const handleSelect = (selection: TextSelection) => {
    setLastSelection(selection);
  };

  const handleDeselect = () => {
    setLastSelection(null);
  };

  const handleScaleChange = (scale: number) => {
    setCurrentScale(scale);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full flex gap-4">
      <div className="w-3/4">
        <p className="font-semibold">PDF Container:</p>
        <div className="p-4 h-[80vh] rounded-md border overflow-y-scroll">
          <PDF
            fileUrl="/sample.pdf"
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            onScaleChange={handleScaleChange}
            onPageChange={handlePageChange}
            // onPdfReady={handlePdfReady}
            highlights={args.highlights}
            size={{ height: '100%', width: '100%' }}
          />
        </div>
        <p>End of container</p>
      </div>
      <div className="w-1/4">
        <div className="flex flex-col gap-2">
          <p>Current page: {currentPage}</p>
          <p>Current scale: {currentScale}</p>
        </div>
        <hr className="my-4" />
        <div className="flex justify-between">
          <button type="button" onClick={() => {}}>
            Prev page
          </button>
          <button type="button" onClick={() => {}}>
            Next page
          </button>
        </div>
        <hr className="my-4" />
        <div>
          <p>Current selection:</p>
          <pre className="h-96 overflow-y-auto overflow-x-hidden whitespace-pre-wrap wrap-break-word">
            {lastSelection ? JSON.stringify(lastSelection, null, 2) : 'No selection'}
          </pre>
        </div>
      </div>
    </div>
  );
};

const Primary: Story = {
  // eslint-disable-next-line react/jsx-props-no-spreading
  render: args => <PdfStoryContent {...args} />,
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

const WithAutoScroll: Story = {
  ...Primary,
  args: {},
};

export { Basic, WithSelections, WithAutoScroll };
export default meta;
