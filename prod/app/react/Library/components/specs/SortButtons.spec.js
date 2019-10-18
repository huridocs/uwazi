"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _SortButtons = require("../SortButtons");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SortButtons', () => {
  let component;
  let instance;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_SortButtons.SortButtons, props));
    instance = component.instance();
  };

  beforeEach(() => {
    props = {
      sortCallback: jasmine.createSpy('sortCallback'),
      merge: jasmine.createSpy('merge'),
      search: { order: 'desc', sort: 'title' },
      templates: (0, _immutable.fromJS)([
      { properties: [
        {},
        { filter: true, name: 'date', label: 'date', type: 'date' },
        { filter: true, name: 'number', label: 'number', type: 'numeric' },
        { filter: true, name: 'my_select', label: 'my select', type: 'select' },
        { filter: true, name: 'sortable_name', label: 'sortableProperty', type: 'text' }] }]),



      stateProperty: 'search',
      storeKey: 'library' };

  });

  describe('Sort options', () => {
    it('should use templates sortable properties as options (with asc and desc for each)', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    describe('when multiple options have the same name', () => {
      it('should not duplicate the entry', () => {
        props.templates = (0, _immutable.fromJS)([
        { properties: [{}, { filter: true, name: 'sortable_name', label: 'sortableProperty', type: 'text' }] },
        { properties: [{ filter: true, name: 'sortable_name', label: 'anotherLabel', type: 'text' }] }]);

        render();

        expect(component.find('li').length).toBe(3);

        expect(component.find('li').last().children().at(0).find('span').last().text()).toBe('sortableProperty (A-Z)');
        expect(component.find('li').last().children().at(1).find('span').last().text()).toBe('sortableProperty (Z-A)');
      });
    });

    describe('when there is an active search term', () => {
      it('should display sort by search relevance option', () => {
        props.search.searchTerm = 'keyword';
        render();
        expect(component.find('li').at(2).children().at(0).find('span').last().text()).toBe('Search relevance');
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
        expect(component.find('li').last().hasClass('is-active')).toBe(true);
      });
    });

    describe('clicking an option', () => {
      it('should sort by that property with default order (asc for text and desc for date)', () => {
        render();
        component.setState({ active: true });
        component.find('li').last().children().at(0).simulate('click');
        expect(props.sortCallback).toHaveBeenCalledWith(
        { search: { sort: 'metadata.sortable_name', order: 'asc', userSelectedSorting: true } }, 'library');


        const templates = props.templates.toJS();
        const lastPropindex = templates[0].properties.length - 1;
        templates[0].properties[lastPropindex].name = 'different_name';
        templates[0].properties[lastPropindex].type = 'date';
        props.templates = (0, _immutable.fromJS)(templates);

        render();
        component.setState({ active: true });

        component.find('li').last().children().at(0).simulate('click');
        expect(props.sortCallback).toHaveBeenCalledWith(
        { search: { sort: 'metadata.different_name', order: 'desc', userSelectedSorting: true } }, 'library');

      });
    });
  });

  describe('sort', () => {
    it('should merge with searchTerm and filtersForm and NOT toggle between asc/desc', () => {
      render();
      instance.sort('title', 'asc', 'number');
      expect(props.sortCallback).toHaveBeenCalledWith({ search: { sort: 'title', order: 'asc', userSelectedSorting: true } }, 'library');

      props.search.order = 'asc';
      props.search.treatAs = 'number';
      render();
      instance.sort('title', 'asc', 'string');
      expect(props.merge).toHaveBeenCalledWith('search', { sort: 'title', order: 'asc', treatAs: 'number' });
      expect(props.sortCallback).toHaveBeenCalledWith({ search: { sort: 'title', order: 'asc', userSelectedSorting: true } }, 'library');
    });

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

    describe('when changing property being sorted', () => {
      it('should use default order', () => {
        props.search = { order: 'desc', sort: 'title' };
        render();
        instance.sort('title');
        expect(props.sortCallback).toHaveBeenCalledWith({ search: { sort: 'title', order: 'asc', userSelectedSorting: true } }, 'library');

        props.sortCallback.calls.reset();
        props.search = { order: 'desc', sort: 'title' };
        render();
        instance.sort('creationDate', 'desc');
        expect(props.sortCallback).toHaveBeenCalledWith({ search: { sort: 'creationDate', order: 'desc', userSelectedSorting: true } }, 'library');

        props.sortCallback.calls.reset();
        props.search = { order: 'desc', sort: 'title' };
        render();
        instance.sort('creationDate', 'asc');
        expect(props.sortCallback).toHaveBeenCalledWith({ search: { sort: 'creationDate', order: 'asc', userSelectedSorting: true } }, 'library');
      });
    });

    describe('when changing order', () => {
      it('should keep the treatAs property', () => {
        props.search = { order: 'desc', sort: 'title', treatAs: 'number' };
        render();
        instance.sort('title');
        instance.changeOrder();
        expect(props.merge).toHaveBeenCalledWith('search', { sort: 'title', order: 'asc', treatAs: 'number' });
      });
    });
  });

  describe('when filtering title property', () => {
    it('should set active title', () => {
      props.search = { order: 'asc', sort: 'title' };
      render();
      const title = component.find('li').at(0);
      expect(title.hasClass('is-active')).toBe(true);
    });
  });

  describe('when filtering creationDate property asc', () => {
    it('should set active recent', () => {
      props.search = { order: 'asc', sort: 'creationDate' };
      render();
      const title = component.find('li').at(0);
      const recent = component.find('li').at(1);
      expect(title.hasClass('is-active')).toBe(false);
      expect(recent.hasClass('is-active')).toBe(true);
    });
  });

  describe('mapStateToProps', () => {
    let templates;

    it('should send all templates from state', () => {
      const state = { templates: (0, _immutable.fromJS)(['item']), library: { search: {} } };
      const _props = { storeKey: 'library' };
      expect((0, _SortButtons.mapStateToProps)(state, _props).templates.get(0)).toBe('item');
    });

    it('should only send selectedTemplates if array passed in ownProps', () => {
      templates = (0, _immutable.fromJS)([{ _id: 'a' }, { _id: 'b' }]);
      const state = { templates, library: { search: {} } };
      const _props = { selectedTemplates: (0, _immutable.fromJS)(['b']), storeKey: 'library' };
      expect((0, _SortButtons.mapStateToProps)(state, _props).templates.getIn([0, '_id'])).toBe('b');
    });

    describe('search', () => {
      beforeEach(() => {
        templates = (0, _immutable.fromJS)([{ _id: 'a' }, { _id: 'b' }]);
      });

      it('should be selected from the state according to the store key', () => {
        const state = { templates, library: { search: 'correct search' } };
        const _props = { storeKey: 'library' };
        expect((0, _SortButtons.mapStateToProps)(state, _props).search).toBe('correct search');
      });

      it('should be selected from the state according to the stateProperty (if passed)', () => {
        let state = { templates, library: { search: 'incorrect search', sort: 'correct search' } };
        let _props = { storeKey: 'library', stateProperty: 'library.sort' };
        expect((0, _SortButtons.mapStateToProps)(state, _props).search).toBe('correct search');

        state = { templates, library: { search: 'incorrect search', sort: 'incorrect search', nested: { dashed: 'correct search' } } };
        _props = { storeKey: 'library', stateProperty: 'library/nested.dashed' };
        expect((0, _SortButtons.mapStateToProps)(state, _props).search).toBe('correct search');
      });
    });
  });
});