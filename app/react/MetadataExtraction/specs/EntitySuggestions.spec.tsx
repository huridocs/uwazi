/**
 * @jest-environment jsdom
 */
import 'mutationobserver-shim';
import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySuggestions } from '../EntitySuggestions';
import * as SuggestionsAPI from '../SuggestionsAPI';

describe('EntitySuggestions', () => {
  const defaultHeaders = [
    'Other title / Suggestion',
    'Action',
    'Title',
    'Segment',
    'Language',
    'StateAllMatchingEmptyPending',
    'Page',
  ];

  const suggestionsData: { suggestions: EntitySuggestionType[]; totalPages: number } = {
    suggestions: [
      {
        entityId: 'shared1',
        sharedId: 'shared1',
        propertyName: 'property1',
        entityTitle: 'Entity title1',
        currentValue: 'Entity title1',
        suggestedValue: 'Olowo Kamali',
        segment: 'Olowo Kamali Case',
        language: 'English',
        state: SuggestionState.matching,
        date: 1,
        page: 5,
      },
      {
        entityId: 'shared2',
        sharedId: 'shared1',
        propertyName: 'property1',
        entityTitle: 'Título entidad',
        currentValue: '',
        suggestedValue: 'Violación caso 1',
        segment: 'Detalle Violación caso 1',
        language: 'Spanish',
        state: SuggestionState.empty,
        date: 2,
        page: 2,
      },
    ],
    totalPages: 4,
  };

  const reviewedProperty: PropertySchema = {
    name: 'other_title',
    type: 'text',
    label: 'Other title',
  };

  const acceptIXSuggestion = jest.fn();

  function renderComponent(property = reviewedProperty) {
    renderConnectedContainer(
      <EntitySuggestions property={property} acceptIXSuggestion={acceptIXSuggestion} />,
      () => defaultState
    );
  }

  beforeEach(async () => {
    spyOn(SuggestionsAPI, 'getSuggestions').and.returnValue(Promise.resolve(suggestionsData));
    await act(async () => {
      renderComponent();
    });
  });

  describe('Render table', () => {
    it('should render the suggestions headers', async () => {
      const suggestionHeaders = screen
        .getAllByRole('columnheader')
        .map(header => header.textContent);
      expect(suggestionHeaders).toEqual(defaultHeaders);
    });

    it('should render the suggestions cells', async () => {
      await act(async () => {
        renderComponent();
      });
      const rows = screen.getAllByRole('row');
      const firstRow = within(rows[1])
        .getAllByRole('cell')
        .map(cell => cell.textContent);
      expect(firstRow).toEqual([
        'Other titleEntity title1SuggestionOlowo Kamali',
        '',
        'Entity title1',
        'Olowo Kamali Case',
        'English',
        'Matching',
        '5',
      ]);
      const secondRow = within(rows[2])
        .getAllByRole('cell')
        .map(cell => cell.textContent);
      expect(secondRow).toEqual([
        'Other title-SuggestionViolación caso 1',
        ' Accept',
        'Título entidad',
        'Detalle Violación caso 1',
        'Spanish',
        'Empty',
        '2',
      ]);
    });

    it('should not render title column when propertyName is title', async () => {
      const titleProperty: PropertySchema = {
        name: 'title',
        type: 'text',
        label: 'Title',
      };
      await act(async () => {
        renderComponent(titleProperty);
      });
      await expect(screen.findByRole('columnheader', { name: 'Title' })).resolves.toReject;
    });
  });

  describe('Pagination', () => {
    it('should retrieve suggestions data when pageIndex changed', async () => {
      await act(async () => {
        renderComponent();
      });
      fireEvent.click(screen.getByText('4'));
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
        renderComponent();
      });
      fireEvent.change(screen.getAllByText('5 per page')[0].parentElement!, {
        target: { value: 10 },
      });
      expect(SuggestionsAPI.getSuggestions).toHaveBeenLastCalledWith({
        data: { filter: { propertyName: 'other_title' }, page: { size: 10, number: 1 } },
        headers: {},
      });
    });
  });

  describe('State filter', () => {
    it('should retrieve suggestions data when state filter changed', async () => {
      await act(async () => {
        renderComponent();
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
});
