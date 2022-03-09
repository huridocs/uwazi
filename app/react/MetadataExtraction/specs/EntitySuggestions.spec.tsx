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
import { EntitySuggestions } from '../EntitySuggestions';
import * as SuggestionsAPI from '../SuggestionsAPI';

describe('EntitySuggestions', () => {
  const acceptIXSuggestion = jest.fn();

  function renderComponent(property = reviewedProperty) {
    renderConnectedContainer(
      <EntitySuggestions property={property} acceptIXSuggestion={acceptIXSuggestion} />,
      () => defaultState
    );
  }

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
          'Other titleEntity title1',
          'SuggestionOlowo Kamali',
          '',
          'Other titleEntity title1',
          'Entity title1',
          'Olowo Kamali Case',
          'English',
          'Matching',
        ]);
        const secondRow = within(rows[2])
          .getAllByRole('cell')
          .map(cell => cell.textContent);
        expect(secondRow).toEqual([
          'SuggestionViolación caso 1',
          '',
          'Other title-',
          'SuggestionViolación caso 1',
          ' Accept',
          'Título entidad',
          'Detalle Violación caso 1',
          'Spanish',
          'Empty',
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
          expect(suggestionHeaders).toContain('Title / Suggestion');
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
          page: { size: 5, number: 4 },
        },
        headers: {},
      });
    });

    it('should retrieve suggestions data when pageSize changed', async () => {
      await act(async () => {
        fireEvent.change(screen.getAllByText('5 per page')[0].parentElement!, {
          target: { value: 10 },
        });
      });
      expect(SuggestionsAPI.getSuggestions).toHaveBeenLastCalledWith({
        data: { filter: { propertyName: 'other_title' }, page: { size: 10, number: 1 } },
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
          target: { value: 'Empty' },
        });
      });
      expect(SuggestionsAPI.getSuggestions).toHaveBeenLastCalledWith({
        data: {
          filter: { state: 'Empty', propertyName: 'other_title' },
          page: { size: 5, number: 1 },
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
      await renderAndCheckSuggestion(invalidSuggestion, 'FechaApr 2, 2020Suggestionno date');
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
          page: { size: 5, number: 1 },
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

      const rows = screen.getAllByRole('row');
      const acceptButton = within(rows[2]).getByLabelText('Accept suggestion');
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
      expect(acceptIXSuggestion).toBeCalledWith(suggestionsData.suggestions[1], true);
      expect(SuggestionsAPI.getSuggestions).toHaveBeenCalledTimes(2);
    });
    it('should accept a suggestion for only the current language of an entity', async () => {
      const languageCheck = screen.getByRole('checkbox');
      await act(async () => {
        fireEvent.click(languageCheck);
      });
      const confirmButton = screen.getByText('Confirm').parentElement!;
      await act(async () => {
        fireEvent.click(confirmButton);
      });
      expect(acceptIXSuggestion).toBeCalledWith(suggestionsData.suggestions[1], false);
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
