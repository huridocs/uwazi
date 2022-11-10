/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, RenderResult, screen } from '@testing-library/react';

import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { fromJS, fromJS as immutable } from 'immutable';

import { IStore } from 'app/istore';
import { actions } from 'react-redux-form';
import { IImmutable } from 'shared/types/Immutable';
import { SortButtons, SortButtonsOwnProps, mapStateToProps } from '../SortButtons';

describe('SortButtons', () => {
  let props: SortButtonsOwnProps;
  let state: Partial<Omit<IStore, 'library'>> & {
    library: { search: { searchTerm?: string; sort?: string; order?: string; treatAs?: string } };
  };
  let renderResult: RenderResult;

  const render = () => {
    ({ renderResult } = renderConnectedContainer(<SortButtons {...props} />, () => state));
  };

  const openDropdown = () => {
    const openBtn = renderResult.container.getElementsByClassName('rw-btn-select')[0];
    fireEvent.click(openBtn);
    const options = screen.getAllByRole('option');
    const optionsLabel = options.map(option => option.textContent);
    return { options, optionsLabel };
  };
  const selectOption = (options: Element[], label: string) => {
    const optionToSelect = options.find(option => option.textContent === label);
    fireEvent.click(optionToSelect!);
  };
  beforeEach(() => {
    state = {
      ...defaultState,
      templates: immutable([
        {
          _id: 'id',
          properties: [
            {},
            { filter: true, name: 'date', label: 'date', type: 'date' },
            { filter: true, name: 'number', label: 'number', type: 'numeric' },
            { filter: true, name: 'my_select', label: 'my select', type: 'select' },
            { filter: true, name: 'sortable_name', label: 'sortableProperty', type: 'text' },
            {
              filter: true,
              name: 'inherited1',
              label: 'inherited1',
              type: 'relationship',
              inherit: {
                type: 'text',
              },
            },
            {
              filter: true,
              name: 'inherited2',
              label: 'inherited2',
              type: 'relationship',
              inherit: {
                type: 'multiselect',
              },
            },
          ],
        },
      ]),
      library: {
        search: {
          sort: 'asc',
        },
      },
    };
    props = {
      sortCallback: jasmine.createSpy('sortCallback'),
      stateProperty: 'library.search',
      selectedTemplates: fromJS([]),
    };
  });

  describe('Sort options', () => {
    it('should use templates sortable properties as options (with asc and desc for each)', () => {
      render();
      expect(renderResult.asFragment()).toMatchSnapshot();
    });
    describe('when multiple options have the same name', () => {
      it('should not duplicate the entry', () => {
        state.templates = immutable([
          {
            _id: 'id',
            properties: [
              {},
              {
                filter: true,
                name: 'sortable_name',
                label: 'sortableProperty',
                type: 'text',
                _id: '_id',
              },
            ],
          },
          {
            properties: [
              {
                filter: true,
                name: 'sortable_name',
                label: 'anotherLabel',
                type: 'text',
                _id: '_id',
              },
            ],
          },
        ]);
        render();
        const { options, optionsLabel } = openDropdown();
        expect(options.length).toBe(4);
        expect(optionsLabel).toEqual(['Title', 'Date added', 'Date modified', 'sortableProperty']);
      });
    });
    describe('when there is an active search term', () => {
      it('should display sort by search relevance option', () => {
        state.library.search.searchTerm = 'keyword';
        render();
        const { optionsLabel } = openDropdown();
        expect(optionsLabel).toContain('Search relevance');
      });

      it('should disable the sort button and show the sort down icon', () => {
        state.library.search.searchTerm = 'keyword';
        state.library.search.sort = '_score';
        render();
        const toggleBtn = renderResult.container.getElementsByClassName(
          'sorting-toggle'
        )[0] as HTMLElement;
        expect(toggleBtn.attributes.getNamedItem('disabled')).toBeDefined();
        expect(toggleBtn.children[0].attributes.getNamedItem('data-icon')?.value).toBe(
          'arrow-down'
        );
      });
    });
    describe('when relevance sorting is active and there is no search term', () => {
      it('should fall back to sorting by most recent creation date', () => {
        state.library.search.sort = '_score';
        state.library.search.searchTerm = '';
        render();
        const combobox = screen.getByRole('combobox');
        expect(combobox.textContent).toBe('Date added');
        expect(renderResult.asFragment()).toMatchSnapshot();
      });
    });

    describe('when active', () => {
      it('should set the option active', () => {
        state.library.search.sort = 'metadata.sortable_name';
        render();
        const combobox = screen.getByRole('combobox');
        expect(combobox.textContent).toBe('sortableProperty');
      });
    });
    describe('clicking an option', () => {
      it('should sort by that property with default order (asc for text and desc for date)', () => {
        render();
        const { options } = openDropdown();
        selectOption(options, 'sortableProperty');
        expect(props.sortCallback).toHaveBeenCalledWith(
          { search: { sort: 'metadata.sortable_name', order: 'asc', userSelectedSorting: true } },
          'library'
        );
        selectOption(options, 'date');
        expect(props.sortCallback).toHaveBeenCalledWith(
          { search: { sort: 'metadata.date', order: 'desc', userSelectedSorting: true } },
          'library'
        );
      });
    });
  });
  describe('sort', () => {
    it('should not fail if no sortCallback', () => {
      /*  @ts-ignore */
      delete props.sortCallback;
      render();
      let error;
      state.library.search.sort = 'title';
      try {
        const searchBtn = screen.getByRole('button');
        fireEvent.click(searchBtn);
      } catch (err) {
        error = err;
      }
      expect(error).toBeUndefined();
    });

    it('should change sorting order when using the order button', () => {
      state.library.search = { order: 'asc', sort: 'title' };
      render();
      const searchBtn = screen.getByRole('button');
      fireEvent.click(searchBtn);
      expect(props.sortCallback).toHaveBeenCalledWith(
        { search: { sort: 'title', order: 'desc', userSelectedSorting: true } },
        'library'
      );
    });
    describe('when changing property being sorted', () => {
      const rerenderSortButtons = () => {
        state.library.search = { order: 'desc', sort: 'title' };
        render();
        // @ts-ignore
        props.sortCallback.calls.reset();
      };
      it('should use default order', () => {
        rerenderSortButtons();
        fireEvent.click(screen.getByRole('button'));
        expect(props.sortCallback).toHaveBeenCalledWith(
          { search: { sort: 'title', order: 'asc', userSelectedSorting: true } },
          'library'
        );
        renderResult.unmount();
        rerenderSortButtons();
        const { options } = openDropdown();
        selectOption(options, 'Date added');
        fireEvent.click(screen.getByRole('button'));
        expect(props.sortCallback).toHaveBeenCalledWith(
          { search: { sort: 'creationDate', order: 'desc', userSelectedSorting: true } },
          'library'
        );
      });
    });

    describe('when changing order', () => {
      it('should keep the treatAs property', () => {
        jest.spyOn(actions, 'merge');
        state.library.search = { order: 'desc', sort: 'title', treatAs: 'number' };
        render();
        const { options } = openDropdown();
        selectOption(options, 'Title');
        fireEvent.click(screen.getByRole('button'));
        expect(actions.merge).toHaveBeenCalledWith('library.search', {
          sort: 'title',
          order: 'asc',
          treatAs: 'number',
        });
      });
    });
  });
  describe('when filtering number property', () => {
    it('should set value to number', () => {
      state.library.search = { order: 'asc', sort: 'number' };
      render();
      const combobox = screen.getByRole('combobox');
      expect(combobox.textContent).toBe('number');
    });
  });

  describe('mapStateToProps', () => {
    let templates: IImmutable<any>[];

    it('should send all templates from state', () => {
      const stateToMap = { templates: immutable(['item']), library: { search: {} } };
      const _props = { storeKey: 'library' };
      // @ts-ignore
      expect(mapStateToProps(stateToMap, _props).templates.get(0)).toBe('item');
    });
    it('should only send selectedTemplates if array passed in ownProps', () => {
      templates = immutable([{ _id: 'a' }, { _id: 'b' }]);
      const stateToMap = { templates, library: { search: {} } };
      const _props = { selectedTemplates: immutable(['b']), storeKey: 'library' };
      // @ts-ignore
      expect(mapStateToProps(stateToMap, _props).templates.getIn([0, '_id'])).toBe('b');
    });

    describe('search', () => {
      beforeEach(() => {
        templates = immutable([{ _id: 'a' }, { _id: 'b' }]);
      });

      it('should be selected from the state according to the store key', () => {
        const stateValues = { templates, library: { search: 'correct search' } };
        const _props = { storeKey: 'library' };
        // @ts-ignore
        expect(mapStateToProps(stateValues, _props).search).toBe('correct search');
      });
      it('should be selected from the state according to the stateProperty (if passed)', () => {
        let stateToMap = {
          templates,
          library: { search: 'incorrect search', sort: 'correct search' },
        };
        let _props = { storeKey: 'library', stateProperty: 'library.sort' };
        // @ts-ignore
        expect(mapStateToProps(stateToMap, _props).search).toBe('correct search');

        stateToMap = {
          templates,
          library: {
            search: 'incorrect search',
            sort: 'incorrect search',
            // @ts-ignore
            nested: { dashed: 'correct search' },
          },
        };
        _props = { storeKey: 'library', stateProperty: 'library/nested.dashed' };
        // @ts-ignore
        expect(mapStateToProps(stateToMap, _props).search).toBe('correct search');
      });
    });
  });
});
