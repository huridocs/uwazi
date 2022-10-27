/**
 * @jest-environment jsdom
 */
import React from 'react';
import { formReducer, FormState } from 'react-redux-form';
import { combineReducers, createStore } from 'redux';
import { fromJS } from 'immutable';
import { fireEvent, RenderResult, screen, within } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import * as libraryActions from 'app/Library/actions/libraryActions';

import { IStore } from 'app/istore';
import { IImmutable } from 'shared/types/Immutable';
import { LibraryHeader, LibraryHeaderOwnProps } from '../LibraryHeader';
import { SearchBar } from '../SearchBar';

describe('LibraryHeader', () => {
  let renderResult: RenderResult;
  const props: LibraryHeaderOwnProps = {
    storeKey: 'library',
    counter: <span>counter</span>,
    selectAllDocuments: jest.fn(),
    sortButtonsStateProperty: 'library.search',
    SearchBar,
    searchCentered: false,
    searchDocuments: jest.fn(),
    filters: fromJS([]),
    tableViewMode: false,
    scrollCount: 0,
  };

  const reducer = combineReducers({
    form: formReducer('library.search', {
      searchTerm: 'Find my document',
      sort: 'title',
    }),
  });
  const storeState = createStore(reducer).getState() as { form: FormState };

  const state: Partial<Omit<IStore, 'library'>> & {
    library: {
      ui: IImmutable<{}>;
      search: { searchTerm?: string; sort?: string };
      filters: IImmutable<{}>;
      searchForm: any;
    };
  } = {
    ...defaultState,
    templates: fromJS([
      {
        _id: 'template1',
        name: 'Template 1',
        properties: [
          { _id: 'property2', name: 'number', label: 'number', type: 'number', filter: true },
        ],
      },
      {
        _id: 'template2',
        name: 'Template 2',
        properties: [
          { _id: 'property1', name: 'text', label: 'text', type: 'text', filter: true },
          {
            _id: 'property3',
            name: 'geolocation',
            label: 'geolocation',
            type: 'geolocation',
            filter: true,
          },
        ],
      },
    ]),
    library: {
      ui: fromJS({
        filtersPanel: [],
        selectedDocuments: [],
        zoomLevel: 2,
        tableViewColumns: [
          { name: 'title', label: 'Title' },
          { name: 'dateAdded', label: 'Creation Date' },
          { name: 'column1', label: 'Column 1' },
        ],
      }),
      filters: fromJS({ documentTypes: ['template2'], properties: [] }),
      search: {
        sort: 'desc',
      },
      searchForm: { ...storeState.form },
    },
    settings: {
      collection: fromJS({}),
    },
    user: fromJS({}),
  };

  const render = () => {
    ({ renderResult } = renderConnectedContainer(<LibraryHeader {...props} />, () => state));
  };

  it('should hold sortButtons with search callback and selectedTemplates', () => {
    render();
    fireEvent.click(screen.getByTitle('open dropdown'));

    const options = screen.getAllByRole('option');
    fireEvent.click(options[1]);

    expect(options.map(option => option.textContent)).toEqual([
      'Title',
      'Date added',
      'Date modified',
      'text',
    ]);
    expect(props.searchDocuments).toHaveBeenCalledWith(
      {
        search: {
          order: 'desc',
          sort: 'creationDate',
          userSelectedSorting: true,
        },
      },
      'library'
    );
  });

  it('should render a Select All button only if authorized', () => {
    render();
    expect(screen.queryByText('Select all')).not.toBeInTheDocument();
    state.user = fromJS({ _id: 'user1', role: 'admin' });
    renderResult.unmount();
    render();
    expect(screen.queryByText('Select all')).toBeInTheDocument();
  });

  it('should include the Toggle Buttons with zoom in and out functionality', () => {
    jest.spyOn(libraryActions, 'zoomIn');
    jest.spyOn(libraryActions, 'zoomOut');

    render();
    fireEvent.click(screen.getByLabelText('Zoom out library view'));
    expect(libraryActions.zoomOut).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Zoom in library view'));
    expect(libraryActions.zoomIn).toHaveBeenCalled();

    expect(screen.queryByLabelText('library list view')).toBeInTheDocument();
    expect(screen.queryByLabelText('library table view')).toBeInTheDocument();
  });
  it('should render HideColumnsDropdown dropdown list with the storeKey', () => {
    props.tableViewMode = true;
    props.storeKey = 'library';
    render();
    const hiddenColumnsDropDown = renderResult.container.getElementsByClassName(
      'hidden-columns-dropdown'
    )[0] as HTMLElement;
    fireEvent.click(within(hiddenColumnsDropDown).getByTitle('open dropdown'));
    screen.debug();
    const options = screen.getAllByRole('option');
    const optionsLabel = options.map(option => option.textContent);
    expect(optionsLabel).toEqual(['Show all', 'Creation Date', 'Column 1']);
  });
});
