/**
 * @jest-environment jsdom
 */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as AtomProvider } from 'jotai';
import { ClientEntitySchema, ClientPropertySchema } from 'app/istore';
import { TestRouterContext } from 'V2/testing/TestRouterContext';
import { SuggestionSidepanel } from '../SuggestionSidepanel';
import { loaderData, suggestion1, textProperty, numericProperty, dateProperty } from './fixtures';

jest.mock('V2/api/entities', () => ({
  getById: jest.fn().mockResolvedValue([
    {
      _id: 'entity1',
      title: 'Test Entity Title',
      sharedId: 'shared1',
      metadata: {},
    } as ClientEntitySchema,
  ]),
  formatter: {
    update: jest.fn().mockImplementation((entity, data) => ({ ...entity, ...data })),
  },
  coerceValue: jest.fn().mockResolvedValue({ success: true, value: 'test' }),
}));

jest.mock('V2/api/files', () => ({
  getById: jest.fn().mockResolvedValue([
    {
      _id: 'file1',
      filename: 'test.pdf',
    },
  ]),
  update: jest.fn().mockResolvedValue({}),
}));

jest.mock('V2/Components/PDFViewer', () => ({
  PDF: ({ onSelect }: any) => {
    const handleTextSelection = () => {
      const mockSelection = {
        text: 'Selected text from\nPDF',
        selectionRectangles: [
          {
            page: 1,
            left: 100,
            top: 100,
            width: 200,
            height: 20,
          },
        ],
      };
      onSelect(mockSelection);
    };
    return (
      <div data-testid="pdf-viewer">
        <div data-testid="selectable-text" onClick={handleTextSelection}>
          text
        </div>
      </div>
    );
  },
  selectionHandlers: {
    adjustSelectionsToScale: jest.fn().mockImplementation(selection => selection),
    getHighlightsFromSelection: jest
      .fn()
      .mockReturnValue({ 1: [{ left: 100, top: 100, width: 200, height: 20 }] }),
    updateFileSelection: jest.fn().mockReturnValue([
      {
        name: 'testProperty',
        id: 'property1',
        selectionRectangles: [
          {
            page: 1,
            left: 100,
            top: 100,
            width: 200,
            height: 20,
          },
        ],
      },
    ]),
  },
}));

describe('SuggestionSidepanel', () => {
  const setShowSidepanelSpy = jest.fn();
  const onEntitySaveSpy = jest.fn();
  const user = userEvent.setup();

  const renderComponent = (property = textProperty) =>
    render(
      <TestRouterContext loaderData={loaderData}>
        <AtomProvider>
          <SuggestionSidepanel
            showSidepanel
            setShowSidepanel={setShowSidepanelSpy}
            onEntitySave={onEntitySaveSpy}
            suggestion={suggestion1}
            property={property}
          />
        </AtomProvider>
      </TestRouterContext>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    const { coerceValue } = jest.requireMock('V2/api/entities');
    coerceValue.mockResolvedValue({ success: true, value: 'test' });
  });

  it('should render the sidepanel with entity title', async () => {
    renderComponent();
    expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
  });

  describe('Click to fill', () => {
    it('should populate the field when selecting plain text', async () => {
      renderComponent();
      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      await user.click(screen.getByTestId('selectable-text'));
      await user.click(screen.getByText('Click to fill'));
      await waitFor(() => {
        const inputField = screen.getByDisplayValue('Selected text from PDF');
        expect(inputField).toBeInTheDocument();
      });
    });

    it('should populate the field when selecting a number', async () => {
      renderComponent(numericProperty);
      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();

      const { coerceValue } = jest.requireMock('V2/api/entities');
      coerceValue.mockResolvedValue({ success: true, value: 42 });

      await user.click(screen.getByTestId('selectable-text'));
      await user.click(screen.getByText('Click to fill'));
      await waitFor(() => {
        const inputField = screen.getByDisplayValue('42');
        expect(inputField).toHaveValue(42);
      });
    });

    it('should populate the field when selecting a date', async () => {
      renderComponent(dateProperty);
      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();

      const { coerceValue } = jest.requireMock('V2/api/entities');
      coerceValue.mockResolvedValue({ success: true, value: 1640995200 });

      await user.click(screen.getByTestId('selectable-text'));
      await user.click(screen.getByText('Click to fill'));
      await waitFor(() => {
        const inputField = screen.getByDisplayValue('2022-01-01');
        expect(inputField).toHaveValue('2022-01-01');
      });
    });
  });

  describe('Multiselect suggestions without segment_context', () => {
    it('should handle multiselect suggestions with old structure (string array)', async () => {
      const multiselectProperty: ClientPropertySchema = {
        _id: 'multiselect_property',
        label: 'Multiselect Property',
        name: 'multiselect_property',
        type: 'multiselect' as any,
        content: 'thesaurus1',
      };

      const suggestionWithOldStructure = {
        ...suggestion1,
        propertyName: 'multiselect_property',
        suggestedValue: [
          '0c9d5eeb-56f4-4728-b179-20a75741155e',
          '1d0e6ffc-67g5-5839-c280-31b86852266f',
        ],
      };

      render(
        <TestRouterContext loaderData={loaderData}>
          <AtomProvider>
            <SuggestionSidepanel
              showSidepanel
              setShowSidepanel={setShowSidepanelSpy}
              onEntitySave={onEntitySaveSpy}
              suggestion={suggestionWithOldStructure}
              property={multiselectProperty}
            />
          </AtomProvider>
        </TestRouterContext>
      );

      // Verify the sidepanel renders without errors
      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();

      // Verify that the component handles the string array format without crashing
      // The key test is that the component processes the old structure correctly
      // and doesn't throw errors when dealing with string arrays instead of objects
      expect(screen.getByText('Multiselect Property')).toBeInTheDocument();

      // Verify that the multiselect interface is rendered
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();

      // The component should handle the string array format gracefully
      // even if the thesaurus data is not available in the test environment
      expect(screen.getByText('No items available')).toBeInTheDocument();
    });
  });
});
