import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { PDF, PDFControls, Snippet } from '#V2/Components/PDFViewer/index.js';
import { highlights, searchResults } from './fixtures/PDFStoryFixtures.js';

type PDFStoryProps = React.ComponentProps<typeof PDF> & { startOnPage?: number };

const PdfStoryContent: React.FC<PDFStoryProps> = ({ startOnPage, ...args }) => {
  const pdfControlsRef = useRef<PDFControls | null>(null);
  const [currentScale, setCurrentScale] = useState(1);
  const [currentPage, setCurrentPage] = useState<number | null>(1);
  const [lastSelection, setLastSelection] = useState<TextSelection | null>(null);
  const [activeResult, setActiveResult] = useState<string | null>(null);
  const [maxPages, setMaxPages] = useState(0);

  const handlePdfReady = (controllers: PDFControls, pages: number) => {
    pdfControlsRef.current = controllers;
    setMaxPages(pages);
  };

  const handleSelect = (selection: TextSelection) => {
    setLastSelection(selection);
  };

  const handleDeselect = () => {
    setLastSelection(null);
  };

  const handleScaleChange = (scale: number) => {
    setCurrentScale(scale);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearSnippet = () => {
    setActiveResult(null);
    pdfControlsRef.current?.deactivateSnippet();
  };

  const goToSnippet = (result: Snippet) => {
    const resultKey = `${result.text}-${result.page}`;
    setActiveResult(resultKey);
    pdfControlsRef.current?.activateSnippet({
      text: result.text,
      page: result.page,
    });
  };

  return (
    <div className="w-full flex gap-4">
      <div className="w-3/4">
        <p className="font-semibold">PDF Container: ({maxPages} pages)</p>
        <div className="p-4 h-[80vh] rounded-md border overflow-y-scroll">
          <PDF
            fileUrl={args.fileUrl}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            onScaleChange={handleScaleChange}
            onPageChange={handlePageChange}
            onPdfReady={(controllers, pages) => {
              handlePdfReady(controllers, pages);
              if (startOnPage) {
                controllers.goToPage(startOnPage);
              }
            }}
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
          <button
            type="button"
            onClick={() => {
              pdfControlsRef.current?.goToPage((currentPage || 0) - 1);
            }}
          >
            Prev page
          </button>
          <button
            type="button"
            onClick={() => {
              pdfControlsRef.current?.goToPage((currentPage || 0) + 1);
            }}
          >
            Next page
          </button>
        </div>
        <hr className="my-4" />
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Search results</p>
          {searchResults.map(result => {
            const resultKey = `${result.text}-${result.page}`;

            return (
              <button
                key={resultKey}
                type="button"
                className="text-left px-2 py-1 rounded border"
                onClick={() => {
                  goToSnippet(result);
                }}
              >
                {activeResult === resultKey ? '-> ' : ''}
                {result.text} (page {result.page})
              </button>
            );
          })}
          <button type="button" className="text-left underline" onClick={clearSnippet}>
            Clear highlighted snippet
          </button>
        </div>
        {args.highlights && (
          <>
            <hr className="my-4" />
            <p>Text selections:</p>
            <div className="flex flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  pdfControlsRef.current?.scrollToHighlight('1-1');
                }}
              >
                Page 1-1
              </button>
              <button
                type="button"
                onClick={() => {
                  pdfControlsRef.current?.scrollToHighlight('1-2');
                }}
              >
                Page 1-2
              </button>
              <button
                type="button"
                onClick={() => {
                  pdfControlsRef.current?.scrollToHighlight('22-1');
                }}
              >
                Page 22
              </button>
            </div>
          </>
        )}
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

const meta = {
  title: 'Viewers/PDF',
  component: PdfStoryContent,
  args: {
    fileUrl: '/sample.pdf',
    onSelect: fn(),
    onDeselect: fn(),
    startOnPage: undefined,
  },
  argTypes: {
    startOnPage: {
      control: { type: 'number' },
      description: 'Page to navigate to after the PDF is ready',
    },
  },
} satisfies Meta<PDFStoryProps>;

type Story = StoryObj<typeof meta>;

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
  args: { startOnPage: 10 },
};

export { Basic, WithSelections, WithAutoScroll };
export default meta;
