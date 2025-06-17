/**
 * @jest-environment jsdom
 */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientPropertySchema, ClientTemplateSchema } from 'app/istore';
import { Provider } from 'jotai';
import { IXSuggestionStateType } from 'shared/types/suggestionType';
import { SuggestionSidepanel } from '../SuggestionSidepanel';

// Mock the PDF component
jest.mock('V2/Components/PDFViewer', () => ({
  PDF: ({ onSelect }: { onSelect: (selection: any) => void }) => (
    <div
      data-testid="mock-pdf"
      onClick={() =>
        onSelect({
          text: 'test selection',
          selectionRectangles: [{ x: 0, y: 0, width: 100, height: 100 }],
        })
      }
    >
      Mock PDF
    </div>
  ),
  selectionHandlers: {
    getHighlightsFromFile: jest.fn(),
    getHighlightsFromSelection: jest.fn(),
    updateFileSelection: jest.fn(),
    deleteFileSelection: jest.fn(),
    adjustSelectionsToScale: jest.fn(),
  },
}));

// Mock the lookup API
jest.mock('V2/api/search', () => ({
  lookup: jest.fn().mockResolvedValue({
    options: [
      { label: 'Test Option 1', value: '1' },
      { label: 'Test Option 2', value: '2' },
    ],
  }),
}));

// Mock the TextProperty component
jest.mock('../TextProperty', () => ({
  TextProperty: () => <div data-testid="mock-text-property">Mock Text Property</div>,
}));

const mockTemplates: ClientTemplateSchema[] = [
  {
    _id: 'template1',
    name: 'Test Template',
    properties: [
      {
        _id: 'prop1',
        name: 'test',
        label: 'Test',
        type: 'text',
      },
    ],
    commonProperties: [
      {
        _id: 'common1',
        name: 'common',
        label: 'Common',
        type: 'text',
      },
    ],
  },
];

const mockProperty: ClientPropertySchema = {
  _id: 'property1',
  name: 'testProperty',
  label: 'Test Property',
  type: 'text',
  required: false,
};

const mockSuggestion = {
  _id: 'suggestion1',
  rowId: 'row1',
  subRows: [],
  entityId: 'entity1',
  entityTemplateId: 'template1',
  propertyName: 'testProperty',
  currentValue: ['current value'],
  suggestedValue: ['suggested value'],
  extractorSource: {
    pdf: true,
  },
  language: 'en',
  status: 'ready' as const,
  confidence: 0.8,
  date: Date.now(),
  extractorId: 'extractor1',
  sharedId: 'shared1',
  fileId: 'file1',
  entityTitle: 'Test Entity',
  segment: 'test-segment',
  state: {
    labeled: false,
    withValue: true,
    withSuggestion: true,
    match: false,
    hasContext: true,
    obsolete: false,
    processing: false,
    error: false,
  } as IXSuggestionStateType,
};

// eslint-disable-next-line max-statements
describe('SuggestionSidepanel', () => {
  const defaultProps = {
    showSidepanel: true,
    setShowSidepanel: jest.fn(),
    suggestion: mockSuggestion,
    onEntitySave: jest.fn(),
    property: mockProperty,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const router = createMemoryRouter(
    [
      {
        index: true,
        path: '/',
        element: <SuggestionSidepanel {...defaultProps} />,
        loader: () => ({ templates: mockTemplates }),
      },
    ],
    {
      initialEntries: ['/'],
    }
  );

  const renderComponent = () =>
    render(
      <Provider>
        <RouterProvider router={router} />
      </Provider>
    );

  it('renders the sidepanel when showSidepanel is true', () => {
    renderComponent();
    expect(screen.getByText('Test Entity')).toBeInTheDocument();
  });

  //   it('does not render when showSidepanel is false', () => {
  //     renderComponent({ showSidepanel: false });
  //     expect(screen.queryByText('Test Entity')).not.toBeInTheDocument();
  //   });

  //   it('renders PDF viewer when suggestion has PDF source', () => {
  //     renderComponent();
  //     expect(screen.getByTestId('mock-pdf')).toBeInTheDocument();
  //   });

  //   it('renders TextProperty when suggestion has property source', () => {
  //     renderComponent({
  //       suggestion: {
  //         ...mockSuggestion,
  //         extractorSource: { property: 'testProperty' },
  //       },
  //     });
  //     expect(screen.getByTestId('mock-text-property')).toBeInTheDocument();
  //   });

  //   it('handles text selection and fill', async () => {
  //     renderComponent();
  //     const pdfElement = screen.getByTestId('mock-pdf');
  //     fireEvent.click(pdfElement);

  //     const clickToFillButton = screen.getByText('Click to fill');
  //     fireEvent.click(clickToFillButton);

  //     await waitFor(() => {
  //       expect(screen.getByDisplayValue('test selection')).toBeInTheDocument();
  //     });
  //   });

  //   it('handles form submission', async () => {
  //     renderComponent();
  //     const acceptButton = screen.getByText('Accept');
  //     fireEvent.click(acceptButton);

  //     await waitFor(() => {
  //       expect(defaultProps.onEntitySave).toHaveBeenCalled();
  //     });
  //   });

  //   it('handles sidepanel close', () => {
  //     renderComponent();
  //     const cancelButton = screen.getByText('Cancel');
  //     fireEvent.click(cancelButton);
  //     expect(defaultProps.setShowSidepanel).toHaveBeenCalled();
  //   });

  //   it('renders select input for select type properties', () => {
  //     renderComponent({
  //       property: {
  //         ...mockProperty,
  //         type: 'select',
  //         content: 'thesaurus1',
  //       },
  //     });
  //     expect(screen.getByRole('combobox')).toBeInTheDocument();
  //   });

  //   it('renders textarea for markdown type properties', () => {
  //     renderComponent({
  //       property: {
  //         ...mockProperty,
  //         type: 'markdown',
  //       },
  //     });
  //     expect(screen.getByRole('textbox')).toBeInTheDocument();
  //   });
});
