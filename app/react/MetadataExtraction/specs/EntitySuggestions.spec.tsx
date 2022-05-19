/**
 * @jest-environment jsdom
 */
/* eslint-disable max-lines */
import 'mutationobserver-shim';
import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import {
  dateSuggestion,
  defaultHeaders,
  reviewedProperty,
  suggestionsData,
} from 'app/MetadataExtraction/specs/fixtures';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { EntitySuggestions } from '../EntitySuggestions';
import * as SuggestionsAPI from '../SuggestionsAPI';

const mockedPDFSidePanelContent = 'Mocked Side Panel';
const filledPropertyValue = 'new value for reviewed property';

jest.mock('app/MetadataExtraction/PDFSidePanel', () => ({
  PDFSidePanel: (props: any) => (
    <button
      type="button"
      onClick={() => props.handleSave({ title: 'abc', other_title: filledPropertyValue })}
    >
      {mockedPDFSidePanelContent}
    </button>
  ),
}));

describe('EntitySuggestions', () => {
  const acceptIXSuggestion = jest.fn();

  const renderComponent = (property = reviewedProperty) => {
    renderConnectedContainer(
      <EntitySuggestions property={property} acceptIXSuggestion={acceptIXSuggestion} />,
      () => defaultState
    );
  };

  describe('Render table', () => {
    beforeEach(async () => {
      spyOn(SuggestionsAPI, 'getSuggestions').and.returnValue(Promise.resolve(suggestionsData));
    });

    describe('Metadata property', () => {
      beforeEach(async () => {
        await act(async () => renderComponent());
      });
      it('should render the suggestions headers', async () => {
        const suggestionHeaders = screen
          .getAllByRole('columnheader')
          .map(header => header.textContent);
        expect(suggestionHeaders).toEqual(defaultHeaders);
      });

      it('should render the suggestions cells', async () => {
        await act(async () => renderComponent());
        const rows = screen.getAllByRole('row');
        const firstRow = within(rows[1])
          .getAllByRole('cell')
          .map(cell => cell.textContent);
        expect(firstRow).toEqual([
          'SuggestionOlowo Kamali',
          '',
          'Other titleEntity title1',
          'Entity title1',
          'PDFOlowo Kamali Case',
          'English',
          SuggestionState.labelMismatch,
        ]);
        const secondRow = within(rows[2])
          .getAllByRole('cell')
          .map(cell => cell.textContent);
        expect(secondRow).toEqual([
          'SuggestionViolación caso 1',
          '',
          'Other title-',
          'Título entidad',
          'PDFDetalle Violación caso 1',
          'Spanish',
          SuggestionState.valueEmpty,
        ]);
      });
    });

    describe('title property', () => {
      it('should not render title column', async () => {
        const titleProperty: PropertySchema = {
          name: 'title',
          type: 'text',
          label: 'Title',
        };
        await act(async () => {
          renderComponent(titleProperty);
          const suggestionHeaders = screen
            .getAllByRole('columnheader')
            .map(header => header.textContent);
          expect(suggestionHeaders).toContain('Suggestion');
          expect(suggestionHeaders).not.toContain('Title');
        });
      });
    });
  });

  describe('Pagination', () => {
    beforeEach(async () => {
      spyOn(SuggestionsAPI, 'getSuggestions').and.returnValue(Promise.resolve(suggestionsData));
      await act(async () => renderComponent());
    });

    it('should retrieve suggestions data when pageIndex changed', async () => {
      await act(async () => {
        fireEvent.click(screen.getByText('4'));
      });
      expect(SuggestionsAPI.getSuggestions).toHaveBeenLastCalledWith({
        data: {
          filter: { propertyName: 'other_title' },
          page: { size: 100, number: 4 },
        },
        headers: {},
      });
    });

    it('should retrieve suggestions data when pageSize changed', async () => {
      await act(async () => {
        fireEvent.change(screen.getAllByText('100 per page')[0].parentElement!, {
          target: { value: 300 },
        });
      });
      expect(SuggestionsAPI.getSuggestions).toHaveBeenLastCalledWith({
        data: { filter: { propertyName: 'other_title' }, page: { size: 300, number: 1 } },
        headers: {},
      });
    });
  });

  describe('State filter', () => {
    beforeEach(async () => {
      spyOn(SuggestionsAPI, 'getSuggestions').and.returnValue(Promise.resolve(suggestionsData));
    });
    it('should retrieve suggestions data when state filter changed', async () => {
      await act(async () => {
        await renderComponent();
        const header = screen.getAllByRole('columnheader', { name: 'State All' })[0];
        fireEvent.change(within(header).getByRole('combobox'), {
          target: { value: SuggestionState.empty },
        });
      });
      expect(SuggestionsAPI.getSuggestions).toHaveBeenLastCalledWith({
        data: {
          filter: { state: SuggestionState.empty, propertyName: 'other_title' },
          page: { size: 100, number: 1 },
        },
        headers: {},
      });
    });
  });

  describe('date property', () => {
    const dateProperty: PropertySchema = {
      name: 'fecha',
      type: 'date',
      label: 'Fecha',
    };

    const renderAndCheckSuggestion = async (
      suggestion: EntitySuggestionType,
      expectedSuggestionCell: string
    ) => {
      spyOn(SuggestionsAPI, 'getSuggestions').and.returnValue(
        Promise.resolve({ suggestions: [suggestion], totalPages: 1 })
      );
      await act(async () => {
        await renderComponent(dateProperty);
      });
      const rows = screen.getAllByRole('row');
      const firstRow = within(rows[1])
        .getAllByRole('cell')
        .map(cell => cell.textContent);
      expect(firstRow).toContain(expectedSuggestionCell);
    };
    it('should format the current value from a date property', async () => {
      await renderAndCheckSuggestion(dateSuggestion, 'FechaApr 2, 2020');
    });
    it('should format the suggestion value from a date property', async () => {
      await renderAndCheckSuggestion(dateSuggestion, 'SuggestionApr 2, 2020');
    });

    it('should should not format is suggestion is a not valid date', async () => {
      const invalidSuggestion = { ...dateSuggestion };
      // @ts-ignore
      invalidSuggestion.suggestedValue = 'no date';
      await renderAndCheckSuggestion(invalidSuggestion, 'Suggestionno date');
    });
  });

  describe('Finding suggestions', () => {
    it('should train the model', async () => {
      await renderComponent();
      const trainingButton = screen.getByText('Find suggestions').parentElement!;
      spyOn(SuggestionsAPI, 'getSuggestions').and.returnValue(Promise.resolve(suggestionsData));
      spyOn(SuggestionsAPI, 'trainModel').and.returnValue(
        Promise.resolve({ message: '', status: 'ready' })
      );
      await act(async () => {
        fireEvent.click(trainingButton);
      });
      expect(SuggestionsAPI.trainModel).toHaveBeenLastCalledWith({
        data: {
          property: 'other_title',
        },
        headers: {},
      });
      expect(SuggestionsAPI.getSuggestions).toHaveBeenLastCalledWith({
        data: {
          filter: { propertyName: 'other_title' },
          page: { size: 100, number: 1 },
        },
        headers: {},
      });
    });
  });

  describe('Accepting suggestion', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
      spyOn(SuggestionsAPI, 'getSuggestions').and.returnValue(Promise.resolve(suggestionsData));
      await act(async () => renderComponent());
    });

    describe('text properties', () => {
      beforeEach(async () => {
        const rows = screen.getAllByRole('row');
        const acceptButton = within(rows[1]).getByLabelText('Accept suggestion');
        await act(async () => {
          fireEvent.click(acceptButton);
        });
      });

      it('should accept a suggestion for all languages of an entity', async () => {
        const languageCheck = screen.getByRole('checkbox') as HTMLInputElement;
        expect(languageCheck.checked).toBe(true);
        const confirmButton = screen.getByText('Confirm').parentElement!;
        await act(async () => {
          fireEvent.click(confirmButton);
        });
        expect(acceptIXSuggestion).toBeCalledWith(suggestionsData.suggestions[0], true);
        expect(SuggestionsAPI.getSuggestions).toHaveBeenCalledTimes(1);
      });
      it('should accept a suggestion for only the current language of an entity', async () => {
        const pendingRow = within(screen.getAllByRole('row')[1])
          .getAllByRole('cell')
          .map(cell => cell.textContent);
        expect(pendingRow[6]).toEqual(SuggestionState.labelMismatch);
        const languageCheck = screen.getByRole('checkbox');
        await act(async () => {
          fireEvent.click(languageCheck);
        });
        const confirmButton = screen.getByText('Confirm').parentElement!;
        await act(async () => {
          fireEvent.click(confirmButton);
        });
        expect(acceptIXSuggestion).toBeCalledWith(suggestionsData.suggestions[0], false);

        const selectedRow = within(screen.getAllByRole('row')[1])
          .getAllByRole('cell')
          .map(cell => cell.textContent);
        expect(selectedRow[6]).toEqual(SuggestionState.labelMatch);
      });
      it('should not accept a suggestion in confirmation is cancelled', async () => {
        const cancelButton = screen.getByLabelText('Close acceptance modal').parentElement!;
        await act(async () => {
          fireEvent.click(cancelButton);
        });
        expect(acceptIXSuggestion).not.toBeCalledWith(suggestionsData.suggestions[1], false);
      });
    });
  });

  describe('Saving entity', () => {
    it('should update the state in the entity table', async () => {
      spyOn(SuggestionsAPI, 'getSuggestions').and.returnValue(Promise.resolve(suggestionsData));
      await act(async () => renderComponent());
      const rows = screen.getAllByRole('row');
      const originalRow = within(rows[2])
        .getAllByRole('cell')
        .map(cell => cell.textContent);
      expect(originalRow[2]).toEqual('Other title-');
      const openPDFButton = within(rows[2]).getByText('PDF').parentElement!;
      await act(async () => {
        fireEvent.click(openPDFButton);
      });
      await act(async () => {
        fireEvent.click(screen.getByText(mockedPDFSidePanelContent));
      });
      const updatedRow = within(screen.getAllByRole('row')[2])
        .getAllByRole('cell')
        .map(cell => cell.textContent);
      expect(updatedRow[2]).toEqual(`Other title${filledPropertyValue}`);
    });
  });
});
