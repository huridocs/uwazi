/**
 * @jest-environment jsdom
 */
import React from 'react';
import { actions as formActions, formReducer, FormState } from 'react-redux-form';
import { combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';
import { MockStoreEnhanced } from 'redux-mock-store';
import Immutable, { fromJS } from 'immutable';
import { fireEvent, RenderResult, screen } from '@testing-library/react';

// @ts-expect-error TS(2307): Cannot find module '../../utils/test/renderConnect... Remove this comment to see the full error message
import { defaultState, renderConnectedContainer } from '../../utils/test/renderConnected.js';
// @ts-expect-error TS(2307): Cannot find module '../../SemanticSearch/actions/a... Remove this comment to see the full error message
import * as semanticSearchActions from '../../SemanticSearch/actions/actions.js';
// @ts-expect-error TS(2307): Cannot find module '../../Library/actions/libraryA... Remove this comment to see the full error message
import * as libraryActions from '../../Library/actions/libraryActions.js';
// @ts-expect-error TS(2307): Cannot find module '../../Library/components/Searc... Remove this comment to see the full error message
import { SearchBar } from '../../Library/components/SearchBar.js';
// @ts-expect-error TS(2307): Cannot find module '../../istore.js' or its corres... Remove this comment to see the full error message
import { IStore } from '../../istore.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/Immutable.j... Remove this comment to see the full error message
import { IImmutable } from 'shared/types/Immutable.js';

describe('SearchBar', () => {
  let renderResult: RenderResult;
  let store: MockStoreEnhanced;
  let state: Partial<Omit<IStore, 'library'>> & {
    library: {
      search: { searchTerm?: string; sort?: string };
      filters: IImmutable<{}>;
      searchForm: any;
    };
  };

  beforeEach(() => {
    const reducer = combineReducers({
      form: formReducer('library.search', {
        searchTerm: 'Find my document',
        sort: 'title',
      }),
    });

    const storeState = createStore(reducer).getState() as { form: FormState };

    jest.spyOn(libraryActions, 'searchDocuments');
    jest.spyOn(formActions, 'change');
    jest.spyOn(semanticSearchActions, 'submitNewSearch');
    state = {
      ...defaultState,
      library: {
        filters: fromJS({ properties: [] }),
        search: {
          searchTerm: '',
          sort: 'title',
        },
        searchForm: { ...storeState.form },
      },
      settings: { collection: Immutable.fromJS({}) },
    };
    ({ renderResult, store } = renderConnectedContainer(
      <SearchBar />,
      () => state,
      'BrowserRouter'
    ));
  });

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm filters and sort', async () => {
      const searchBoxInput = screen.getByRole('textbox') as HTMLInputElement;
      fireEvent.change(searchBoxInput, { target: { value: 'SEARCH MODEL VALUES' } });
      expect(searchBoxInput.value).toEqual('SEARCH MODEL VALUES');
      state.library.search.searchTerm = 'SEARCH MODEL VALUES';
      renderResult.rerender(
        <Provider store={store}>
          <SearchBar />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button'));

      expect(libraryActions.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          search: {
            searchTerm: 'SEARCH MODEL VALUES',
            sort: 'title',
          },
        })
      );
    });
  });

  describe('reset search', () => {
    it('should update the model in the store', () => {
      fireEvent.click(screen.getByLabelText('Reset Search input'));
      expect(formActions.change).toHaveBeenCalledWith('library.search.searchTerm', '');
      expect(libraryActions.searchDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          search: {
            searchTerm: '',
            filters: {},
            sort: 'title',
          },
        })
      );
    });
  });
});
