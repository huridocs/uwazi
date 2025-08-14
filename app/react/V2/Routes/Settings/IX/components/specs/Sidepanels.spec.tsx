/**
 * @jest-environment jsdom
 */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ClientPropertySchema } from 'app/istore';
import { TestRouterContext } from 'V2/testing/TestRouterContext';
import { TestAtomStoreProvider as AtomProvider } from 'V2/testing';
import { thesauriAtom } from 'V2/atoms';
import {
  loaderData,
  suggestion1,
  textProperty,
  numericProperty,
  dateProperty,
  selectProperty,
  relationshipProperty,
  template1,
  entity1,
  thesauri,
} from './fixtures';
import { PDFSidepanel } from '../PDFSidepanel';
import { PropertySidepanel } from '../PropertySidepanel';
import * as sidepanelFunctions from '../../helpers/sidepanelFunctions';

const renderPDFSidepanel = (
  suggestion: any,
  property: ClientPropertySchema,
  onEntitySave = jest.fn(),
  setShowSidepanel = jest.fn()
) =>
  render(
    <TestRouterContext loaderData={loaderData}>
      <AtomProvider initialValues={[[thesauriAtom, thesauri]]}>
        <PDFSidepanel
          showSidepanel
          setShowSidepanel={setShowSidepanel}
          onEntitySave={onEntitySave}
          suggestion={suggestion}
          property={property}
        />
      </AtomProvider>
    </TestRouterContext>
  );

const renderPropertySidepanel = (
  suggestion: any,
  property: ClientPropertySchema,
  onEntitySave = jest.fn(),
  setShowSidepanel = jest.fn()
) =>
  render(
    <TestRouterContext loaderData={loaderData}>
      <AtomProvider initialValues={[[thesauriAtom, thesauri]]}>
        <PropertySidepanel
          showSidepanel
          setShowSidepanel={setShowSidepanel}
          onEntitySave={onEntitySave}
          suggestion={suggestion}
          property={property}
        />
      </AtomProvider>
    </TestRouterContext>
  );

const createSuggestionWithProperty = (propertyName: string, additionalProps = {}) => ({
  ...suggestion1,
  propertyName,
  ...additionalProps,
});

const clickToFillAndWait = async (expectedValue: any) => {
  fireEvent.click(screen.getByTestId('selectable-text'));
  fireEvent.click(screen.getByText('Click to fill'));
  await waitFor(() => {
    screen.getByDisplayValue(expectedValue);
  });
};

const mockCoerceValue = (result: { success: boolean; value?: any }) => {
  const { coerceValue: coerceValueMock } = jest.requireMock('V2/api/entities');
  coerceValueMock.mockResolvedValue(result);
};

jest.mock('V2/api/entities', () => ({
  getById: jest.fn().mockResolvedValue([
    {
      _id: 'entity1',
      title: 'Test Entity Title',
      sharedId: 'shared1',
      metadata: {
        text_property: [{ value: 'current text value' }],
        numeric_property: [{ value: 42 }],
        date_property: [{ value: 1640995200 }],
        markdown_property: [{ value: 'current markdown value' }],
        select_property: [{ value: 'option1' }],
        relationship_property: [{ value: 'entity2' }],
      },
    },
  ]),
  getBySharedId: jest.fn().mockResolvedValue([
    {
      _id: 'entity2',
      title: 'entity2',
      sharedId: 'entity2',
      metadata: {},
    },
    {
      _id: 'suggested_entity',
      title: 'suggested_entity',
      sharedId: 'suggested_entity',
      metadata: {},
    },
  ]),
  formatter: {
    update: jest.fn().mockImplementation((entity, data) => ({ ...entity, ...data })),
  },
  coerceValue: jest.fn().mockResolvedValue({ success: true, value: 'test' }),
  save: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('V2/api/search', () => ({
  lookup: jest.fn().mockResolvedValue({
    rows: [
      {
        _id: 'entity2',
        title: 'entity2',
        sharedId: 'entity2',
        template: 'template2',
      },
      {
        _id: 'suggested_entity',
        title: 'suggested_entity',
        sharedId: 'suggested_entity',
        template: 'template2',
      },
    ],
    count: 2,
  }),
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
        text: 'Selected text from PDF',
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
        name: 'text_property',
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

describe('Basic rendering', () => {
  it('should render the sidepanel with entity title', async () => {
    renderPDFSidepanel(suggestion1, textProperty);
    expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
  });
});

describe('Sidepanel forms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { coerceValue } = jest.requireMock('V2/api/entities');
    coerceValue.mockResolvedValue({ success: true, value: 'test' });
  });

  describe('Basic form elements', () => {
    it.each([
      {
        property: textProperty,
        propertyName: 'text_property',
        expectedValue: 'current text value',
        expectedInputType: 'text',
        description: 'text input',
      },
      {
        property: numericProperty,
        propertyName: 'numeric_property',
        expectedValue: 42,
        expectedInputType: 'number',
        description: 'numeric input',
      },
      {
        property: dateProperty,
        propertyName: 'date_property',
        expectedValue: '2022-01-01',
        expectedInputType: 'date',
        description: 'date input',
      },
      {
        property: {
          _id: 'markdownProperty',
          label: 'Markdown Property',
          name: 'markdown_property',
          type: 'markdown',
        } as ClientPropertySchema,
        propertyName: 'markdown_property',
        expectedValue: 'current markdown value',
        expectedInputType: 'textarea',
        description: 'markdown textarea',
      },
    ])(
      'should render $description with current value and correct type',
      async ({ property, propertyName, expectedValue, expectedInputType }) => {
        const suggestionWithProperty = createSuggestionWithProperty(propertyName);

        renderPDFSidepanel(suggestionWithProperty, property);

        expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
        await waitFor(() => {
          const inputElement = screen.getByDisplayValue(expectedValue);
          if (expectedInputType === 'textarea') {
            expect(inputElement.tagName).toBe('TEXTAREA');
          } else {
            expect(inputElement).toHaveAttribute('type', expectedInputType);
          }
        });
      }
    );

    it.each([
      {
        property: textProperty,
        propertyName: 'text_property',
        selectedText: 'Selected text from PDF',
        expectedValue: 'Selected text from PDF',
        description: 'text input',
      },
      {
        property: numericProperty,
        propertyName: 'numeric_property',
        selectedText: '42 and some text',
        expectedValue: 42,
        description: 'numeric input',
        coerceValue: { success: true, value: 42 },
      },
      {
        property: dateProperty,
        propertyName: 'date_property',
        selectedText: '2022-01-01',
        expectedValue: '2022-01-01',
        description: 'date input',
        coerceValue: { success: true, value: 1640995200 },
      },
    ])(
      'should click to fill and update $description with coerced value',
      async ({ property, propertyName, expectedValue, coerceValue }) => {
        if (coerceValue) {
          mockCoerceValue(coerceValue);
        }

        const suggestionWithProperty = createSuggestionWithProperty(propertyName);

        renderPDFSidepanel(suggestionWithProperty, property);

        expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
        await clickToFillAndWait(expectedValue);
      }
    );

    it('should show error when coerceValue fails for numeric property', async () => {
      mockCoerceValue({ success: false });

      const suggestionWithProperty = createSuggestionWithProperty('numeric_property');

      renderPDFSidepanel(suggestionWithProperty, numericProperty);

      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('selectable-text'));
      fireEvent.click(screen.getByText('Click to fill'));

      await waitFor(() => {
        expect(
          screen.getByText('Value cannot be transformed to the correct type')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Select form elements', () => {
    it('should show suggestions in orange/red', async () => {
      const suggestionWithProperty = createSuggestionWithProperty('select_property', {
        suggestedValue: 'suggested_option',
      });

      renderPDFSidepanel(suggestionWithProperty, selectProperty);

      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      await waitFor(() => {
        const suggestionElement = screen.getByText('Suggested Option');
        expect(suggestionElement).toHaveClass('bg-orange-50', 'text-orange-800');
      });
    });

    it('should show selected suggestions in green', async () => {
      const suggestionWithProperty = createSuggestionWithProperty('select_property', {
        suggestedValue: 'option1',
      });

      renderPDFSidepanel(suggestionWithProperty, selectProperty);

      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      await waitFor(() => {
        const selectedSuggestionElement = screen.getByText('Option 1');
        expect(selectedSuggestionElement).toHaveClass('bg-success-50', 'text-success-800');
      });
    });
  });

  describe('Relationship form elements', () => {
    it('should show suggestions in orange/red', async () => {
      const suggestionWithProperty = createSuggestionWithProperty('relationship_property', {
        currentValue: ['entity2'],
        suggestedValue: 'suggested_entity',
      });

      renderPDFSidepanel(suggestionWithProperty, relationshipProperty);

      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      await waitFor(() => {
        const suggestionElement = screen.getByText('suggested_entity');
        expect(suggestionElement).toHaveClass('bg-orange-50', 'text-orange-800');
      });
    });

    it('should show selected suggestions in green', async () => {
      const suggestionWithProperty = createSuggestionWithProperty('relationship_property', {
        currentValue: ['entity2'],
        suggestedValue: 'entity2',
      });

      renderPDFSidepanel(suggestionWithProperty, relationshipProperty);

      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      await waitFor(() => {
        const selectedSuggestionElement = screen.getByText('entity2');
        expect(selectedSuggestionElement).toHaveClass('bg-success-50', 'text-success-800');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle required property validation', async () => {
      const requiredTextProperty = { ...textProperty, required: true };
      const suggestionWithRequiredProperty = createSuggestionWithProperty('text_property');

      renderPropertySidepanel(suggestionWithRequiredProperty, requiredTextProperty);

      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();

      const input = screen.getByDisplayValue('current text value');
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.click(screen.getByText('Accept'));
      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });
  });

  describe('form submit', () => {
    it('should handle disabled state during form submission', async () => {
      renderPDFSidepanel(suggestion1, textProperty);

      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      const clickToFillButton = screen.getByText('Click to fill');
      expect(clickToFillButton).toBeInTheDocument();
    });

    it('should save with extracted metadata', async () => {
      const handleEntitySaveSpy = jest.spyOn(sidepanelFunctions, 'handleEntitySave');

      renderPDFSidepanel(suggestion1, textProperty);

      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('selectable-text'));
      fireEvent.click(screen.getByText('Click to fill'));
      fireEvent.click(screen.getByText('Accept'));

      await waitFor(() => {
        expect(handleEntitySaveSpy).toHaveBeenCalledWith(
          {
            ...entity1,
            __extractedMetadata: {
              fileID: 'file1',
              selections: [
                {
                  id: 'property1',
                  name: 'text_property',
                  selectionRectangles: [{ height: 20, left: 100, page: 1, top: 100, width: 200 }],
                },
              ],
            },
          },
          textProperty,
          'Selected text from PDF',
          template1,
          true
        );
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

      const suggestionWithOldStructure = createSuggestionWithProperty('multiselect_property', {
        suggestedValue: [
          '0c9d5eeb-56f4-4728-b179-20a75741155e',
          '1d0e6ffc-67g5-5839-c280-31b86852266f',
        ],
      });

      renderPropertySidepanel(suggestionWithOldStructure, multiselectProperty);

      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();
      expect(screen.getByText('Multiselect Property')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Suggested Option')).toBeInTheDocument();
    });
  });

  describe('Select and search', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should do the initial search, select text, then search and populate the field when the toggle is on', async () => {
      const { lookup } = jest.requireMock('V2/api/search');

      const suggestionWithProperty = createSuggestionWithProperty('relationship_property');
      renderPDFSidepanel(suggestionWithProperty, relationshipProperty);
      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();

      expect(lookup).toHaveBeenCalledWith({
        entityTitle: '',
        template: 'template2',
      });

      fireEvent.click(screen.getByTestId('selectable-text'));
      fireEvent.click(screen.getByText('Select & Search'));

      await waitFor(() => {
        expect(lookup).toHaveBeenCalledWith({
          entityTitle: 'Selected text from PDF',
          template: 'template2',
        });
      });

      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toHaveValue('Selected text from PDF');
    });

    it('should do the initial search, and not populate the field or do more searches when the toggle is off', async () => {
      const { lookup } = jest.requireMock('V2/api/search');

      const suggestionWithProperty = createSuggestionWithProperty('relationship_property');
      renderPDFSidepanel(suggestionWithProperty, relationshipProperty);
      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();

      expect(lookup).toHaveBeenCalledWith({
        entityTitle: '',
        template: 'template2',
      });

      fireEvent.click(screen.getByTestId('selectable-text'));

      await waitFor(() => {
        expect(lookup).toHaveBeenCalledTimes(1);
      });

      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toHaveValue('');
    });

    it('should not clear the field when toggling select and search off', async () => {
      const suggestionWithProperty = createSuggestionWithProperty('relationship_property');
      renderPDFSidepanel(suggestionWithProperty, relationshipProperty);
      expect(await screen.findByText('Test Entity Title')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('selectable-text'));
      fireEvent.click(screen.getByText('Select & Search'));
      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toHaveValue('Selected text from PDF');

      fireEvent.click(screen.getByText('Select & Search'));
      expect(searchInput).toHaveValue('Selected text from PDF');
    });
  });
});
