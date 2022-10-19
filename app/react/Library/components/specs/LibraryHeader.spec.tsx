/**
 * @jest-environment jsdom
 */
import React from 'react';
import { formReducer, FormState } from 'react-redux-form';
import { combineReducers, createStore } from 'redux';
import { fromJS } from 'immutable';

import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { IStore } from 'app/istore';
import { IImmutable } from 'shared/types/Immutable';
import { LibraryHeader, LibraryHeaderOwnProps } from '../LibraryHeader';

describe('LibraryHeader', () => {
  const props: LibraryHeaderOwnProps = {
    storeKey: 'library',
    counter: <span>counter</span>,
    selectAllDocuments: jest.fn(),
    sortButtonsStateProperty: 'library.search',
  };

  const reducer = combineReducers({
    form: formReducer('library.search', {
      searchTerm: 'Find my document',
      sort: 'title',
    }),
  });

  let state: Partial<Omit<IStore, 'library'>> & {
    library: {
      ui: IImmutable<{}>;
      search: { searchTerm?: string; sort?: string };
      filters: IImmutable<{}>;
      searchForm: any;
    };
  };

  const storeState = createStore(reducer).getState() as { form: FormState };

  state = {
    ...defaultState,
    templates: fromJS([]),
    library: {
      ui: fromJS({ filtersPanel: [], selectedDocuments: [], zoomLevel: 2 }),
      filters: fromJS({ documentTypes: [], properties: [] }),
      search: {
        sort: 'desc',
      },
      searchForm: { ...storeState.form },
    },
    settings: {
      collection: fromJS({}),
    },
    user: fromJS({ _id: '1234' }),
  };

  const render = () => {
    renderConnectedContainer(<LibraryHeader {...props} />, () => state);
  };

  it.todo('should hold sortButtons with search callback and selectedTemplates');
  // expect(component.find(SortButtons).props().sortCallback).toBe(props.searchDocuments);
  // expect(component.find(SortButtons).props().selectedTemplates).toBe(
  //   props.filters.get('documentTypes')
  // );

  it.todo('should render a Select All button only if authorized');
  // expect(component.find('.select-all-documents').parent().is(NeedAuthorization)).toBe(true);
});
