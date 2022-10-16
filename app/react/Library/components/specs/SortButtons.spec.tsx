import React from 'react';
import { shallow } from 'enzyme';
import { fromJS as immutable } from 'immutable';

import { SortButtons, mapStateToProps } from '../SortButtons';

describe('SortButtons', () => {
  let component;
  let instance;
  let props;

  const render = () => {
    component = shallow(<SortButtons {...props} />);
    instance = component.instance();
  };

  beforeEach(() => {
    props = {
      sortCallback: jasmine.createSpy('sortCallback'),
      merge: jasmine.createSpy('merge'),
      search: { order: 'desc', sort: 'title' },
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
      stateProperty: 'search',
      storeKey: 'library',
    };
  });

  describe('Sort options', () => {
    it('should use templates sortable properties as options (with asc and desc for each)', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    describe('when multiple options have the same name', () => {
      it('should not duplicate the entry', () => {
        props.templates = immutable([
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
        expect(component.find('.sort-dropdown').props().data.length).toBe(4);
        expect(component.find('.sort-dropdown').props().data).toContainEqual({
          context: 'id',
          label: 'sortableProperty',
          name: 'sortable_name',
          type: 'text',
          value: 'metadata.sortable_name',
        });
      });
    });

    describe('when there is an active search term', () => {
      it('should display sort by search relevance option', () => {
        props.search.searchTerm = 'keyword';
        render();
        expect(component.find('.sort-dropdown').props().data).toContainEqual({
          context: 'System',
          label: 'Search relevance',
          type: 'number',
          value: '_score',
        });
      });

      it('should disable the sort button and show the sort down icon', () => {
        props.search.searchTerm = 'keyword';
        props.search.sort = '_score';
        render();
        expect(component.find('.sorting-toggle').props().disabled).toBe(true);
        expect(component.find('.sorting-toggle').props().children.props.icon).toBe('arrow-down');
      });
    });

    describe('when relevance sorting is active and there is no search term', () => {
      it('should fall back to sorting by most recent creation date', () => {
        props.search.sort = '_score';
        render();
        expect(component).toMatchSnapshot();
      });
    });

    describe('when active', () => {
      it('should set the option active', () => {
        props.search.sort = 'metadata.sortable_name';
        render();
        expect(component.find('.sort-dropdown').props().value).toBe('metadata.sortable_name');
      });
    });

    describe('clicking an option', () => {
      it('should sort by that property with default order (asc for text and desc for date)', () => {
        render();
        component
          .find('.sort-dropdown')
          .simulate('change', { value: 'metadata.sortable_name', type: 'select' });
        expect(props.sortCallback).toHaveBeenCalledWith(
          { search: { sort: 'metadata.sortable_name', order: 'asc', userSelectedSorting: true } },
          'library'
        );

        component
          .find('.sort-dropdown')
          .simulate('change', { value: 'metadata.different_name', type: 'date' });
        expect(props.sortCallback).toHaveBeenCalledWith(
          { search: { sort: 'metadata.different_name', order: 'desc', userSelectedSorting: true } },
          'library'
        );
      });
    });
  });

  describe('sort', () => {
    it('should not fail if no sortCallback', () => {
      delete props.sortCallback;
      render();
      let error;
      try {
        instance.sort('title');
      } catch (err) {
        error = err;
      }
      expect(error).toBeUndefined();
    });

    it('should change sorting order when using the order button', () => {
      props.search = { order: 'asc', sort: 'title' };
      render();
      component.find('button[type="button"]').simulate('click');
      expect(props.sortCallback).toHaveBeenCalledWith(
        { search: { sort: 'title', order: 'desc', userSelectedSorting: true } },
        'library'
      );
    });
    describe('when changing property being sorted', () => {
      it('should use default order', () => {
        props.search = { order: 'desc', sort: 'title' };
        render();
        instance.sort('title', 'string');
        expect(props.sortCallback).toHaveBeenCalledWith(
          { search: { sort: 'title', order: 'asc', userSelectedSorting: true } },
          'library'
        );

        props.sortCallback.calls.reset();
        props.search = { order: 'desc', sort: 'title' };
        render();
        instance.sort('creationDate', 'number');
        expect(props.sortCallback).toHaveBeenCalledWith(
          { search: { sort: 'creationDate', order: 'desc', userSelectedSorting: true } },
          'library'
        );

        props.sortCallback.calls.reset();
        props.search = { order: 'desc', sort: 'title' };
        render();
        instance.sort('creationDate', 'number');
        expect(props.sortCallback).toHaveBeenCalledWith(
          { search: { sort: 'creationDate', order: 'desc', userSelectedSorting: true } },
          'library'
        );
      });
    });

    describe('when changing order', () => {
      it('should keep the treatAs property', () => {
        props.search = { order: 'desc', sort: 'title', treatAs: 'number' };
        render();
        instance.sort('title', 'number');
        instance.changeOrder();
        expect(props.merge).toHaveBeenCalledWith('search', {
          sort: 'title',
          order: 'asc',
          treatAs: 'number',
        });
      });
    });
  });

  describe('when filtering number property', () => {
    it('should set value to number', () => {
      props.search = { order: 'asc', sort: 'number' };
      render();
      expect(component.find('.sort-dropdown').props().value).toBe('number');
    });
  });

  describe('mapStateToProps', () => {
    let templates;

    it('should send all templates from state', () => {
      const state = { templates: immutable(['item']), library: { search: {} } };
      const _props = { storeKey: 'library' };
      expect(mapStateToProps(state, _props).templates.get(0)).toBe('item');
    });

    it('should only send selectedTemplates if array passed in ownProps', () => {
      templates = immutable([{ _id: 'a' }, { _id: 'b' }]);
      const state = { templates, library: { search: {} } };
      const _props = { selectedTemplates: immutable(['b']), storeKey: 'library' };
      expect(mapStateToProps(state, _props).templates.getIn([0, '_id'])).toBe('b');
    });

    describe('search', () => {
      beforeEach(() => {
        templates = immutable([{ _id: 'a' }, { _id: 'b' }]);
      });

      it('should be selected from the state according to the store key', () => {
        const state = { templates, library: { search: 'correct search' } };
        const _props = { storeKey: 'library' };
        expect(mapStateToProps(state, _props).search).toBe('correct search');
      });

      it('should be selected from the state according to the stateProperty (if passed)', () => {
        let state = { templates, library: { search: 'incorrect search', sort: 'correct search' } };
        let _props = { storeKey: 'library', stateProperty: 'library.sort' };
        expect(mapStateToProps(state, _props).search).toBe('correct search');

        state = {
          templates,
          library: {
            search: 'incorrect search',
            sort: 'incorrect search',
            nested: { dashed: 'correct search' },
          },
        };
        _props = { storeKey: 'library', stateProperty: 'library/nested.dashed' };
        expect(mapStateToProps(state, _props).search).toBe('correct search');
      });
    });
  });
});
