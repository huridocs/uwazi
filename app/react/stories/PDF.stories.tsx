import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
import { PDF, PDFHandle } from '#V2/Components/PDFViewer/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { highlights } from './fixtures/PDFStoryFixtures.js';

const meta: Meta<typeof PDF> = {
  title: 'Viewers/PDF',
  component: PDF,
  args: { onSelect: fn(), onDeselect: fn() },
};

type Story = StoryObj<typeof PDF>;

const PdfStoryContent: React.FC<React.ComponentProps<typeof PDF>> = args => {
  const pdfRef = useRef<PDFHandle | null>(null);
  const [currentScale, setCurrentScale] = useState(1);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [lastSelection, setLastSelection] = useState<any | null>(null);
  const [snippetText, setSnippetText] = useState('');

  const handleSelect = (selection: any) => {
    setLastSelection(selection);
    args.onSelect?.(selection);
  };

  const handleDeselect = () => {
    setLastSelection(null);
    args.onDeselect?.();
  };

  const handleScaleChange = (scale: number) => {
    setCurrentScale(scale);
    args.onScaleChange?.(scale);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    args.onPageChange?.(page);
  };

  const goToPage2 = () => {
    pdfRef.current?.goToPage(2);
  };

  const scrollToFirstHighlight = () => {
    const pageIds = Object.keys(args.highlights || {});
    if (!pageIds.length) return;
    const firstPageHighlights = (args.highlights || {})[pageIds[0]] || [];
    if (!firstPageHighlights.length) return;
    pdfRef.current?.scrollToHighlight(firstPageHighlights[0].key);
  };

  const handleSnippetChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const { value } = event.target;
    setSnippetText(value);

    if (!value) {
      pdfRef.current?.deactivateSnippet();
      return;
    }

    pdfRef.current?.activateSnippet({
      text: value,
      page: currentPage || 1,
    });
  };

  const clearSnippet = () => {
    setSnippetText('');
    pdfRef.current?.deactivateSnippet();
  };

  return (
    <div className="tw-content space-y-4">
      <div className="flex flex-wrap items-end gap-4 text-sm">
        <button
          type="button"
          className="bg-gray-50 px-4 py-2 rounded-md border-1 border-gray-300 cursor-pointer hover:bg-gray-100"
          onClick={goToPage2}
        >
          Go to page 2
        </button>
        <button
          type="button"
          className="bg-gray-50 px-4 py-2 rounded-md border-1 border-gray-300  cursor-pointer hover:bg-gray-100"
          onClick={scrollToFirstHighlight}
        >
          Scroll to first highlight
        </button>
        <InputField
          id="snippet-search"
          label="Search snippet"
          type="search"
          value={snippetText}
          onChange={handleSnippetChange}
          clearFieldAction={clearSnippet}
          className="w-80"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-2 basis-2/3 min-w-[480px]">
          <p className="font-semibold">PDF Container:</p>
          <div className="p-4 h-[80vh] rounded-md border overflow-scroll">
            <PDF
              ref={pdfRef}
              fileUrl="/sample.pdf"
              onSelect={handleSelect}
              onDeselect={handleDeselect}
              onScaleChange={handleScaleChange}
              onPageChange={handlePageChange}
              highlights={args.highlights}
              size={{ height: '100%', width: '100%' }}
            />
          </div>
          <p>End of container</p>
        </div>

        <div className="flex flex-col gap-2 basis-1/3 min-w-[260px] text-sm">
          <p className="font-semibold">Debug info</p>
          <div className="mt-2 space-y-1">
            <div>
              <span className="font-semibold">Current page:</span> <span>{currentPage ?? '—'}</span>
            </div>
            <div>
              <span className="font-semibold">Current scale:</span>{' '}
              <span>{currentScale.toFixed(3)}</span>
            </div>
            <div>
              <span className="font-semibold">Last selection:</span>
              <pre className="mt-1 max-h-40 w-[360px] overflow-y-auto overflow-x-hidden bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap break-words">
                {lastSelection ? JSON.stringify(lastSelection, null, 2) : '—'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Primary: Story = {
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

const WithScroll: Story = {
  ...Primary,
  args: {},
};

export { Basic, WithSelections, WithScroll };
export default meta;
