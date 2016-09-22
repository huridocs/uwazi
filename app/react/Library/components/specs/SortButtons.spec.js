import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as immutable} from 'immutable';

import {SortButtons} from 'app/Library/components/SortButtons';

describe('SortButtons', () => {
  let component;
  let instance;
  let props;

  let render = () => {
    component = shallow(<SortButtons {...props}/>);
    instance = component.instance();
  };

  beforeEach(() => {
    props = {
      searchDocuments: jasmine.createSpy('searchDocuments'),
      merge: jasmine.createSpy('merge'),
      search: {order: 'desc', sort: 'title.raw'},
      templates: immutable([
        {properties: [{}, {sortable: true, name: 'sortable_name', label: 'sortableProperty', type: 'text'}]}
      ])
    };
  });

  describe('Sort options', () => {
    it('should use templates sortable properties as options', () => {
      render();
      expect(component.find('span').length).toBe(3);
      expect(component.find('span').first().text()).toBe('sortableProperty');
    });

    describe('when active', () => {
      it('should set the option active and add a caret', () => {
        props.search.sort = 'metadata.sortable_name.raw';
        render();
        expect(component.find('span').first().find('i').props().className).toBe('fa fa-caret-down');
      });
    });

    describe('clicking an option', () => {
      it('should sort by that property with default order (asc for text and desc for date)', () => {
        render();
        component.find('span').first().simulate('click');
        expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'metadata.sortable_name.raw', order: 'asc'});

        const templates = props.templates.toJS();
        templates[0].properties[1].type = 'date';
        props.templates = immutable(templates);

        render();

        component.find('span').first().simulate('click');
        expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'metadata.sortable_name.raw', order: 'desc'});
      });
    });
  });

  describe('sort', () => {
    it('should merge with searchTerm and filtersForm and toggle between asc/desc', () => {
      render();
      instance.sort('title.raw');
      expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'title.raw', order: 'asc'});

      props.search.order = 'asc';
      render();
      instance.sort('title.raw');
      expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'title.raw', order: 'desc'});
      expect(props.merge).toHaveBeenCalledWith('search', {sort: 'title.raw', order: 'desc'});
    });

    describe('when changing property being sorted', () => {
      it('should use default order', () => {
        props.search = {order: 'desc', sort: 'title.raw'};
        render();
        instance.sort('title.raw');
        expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'title.raw', order: 'asc'});

        props.searchDocuments.calls.reset();
        props.search = {order: 'desc', sort: 'title.raw'};
        render();
        instance.sort('creationDate', 'desc');
        expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'creationDate', order: 'desc'});

        props.searchDocuments.calls.reset();
        props.search = {order: 'desc', sort: 'title.raw'};
        render();
        instance.sort('creationDate', 'asc');
        expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'creationDate', order: 'asc'});
      });
    });
  });

  describe('when filtering title.raw property asc', () => {
    it('should set active title.raw with up arrow', () => {
      props.search = {order: 'asc', sort: 'title.raw'};
      render();
      let title = component.find('span').at(1);
      expect(title.hasClass('active')).toBe(true);
      expect(title.find('i').hasClass('fa-caret-up')).toBe(true);
    });
  });

  describe('when filtering title.raw property desc', () => {
    it('should set active title.raw with up arrow', () => {
      props.search = {order: 'desc', sort: 'title.raw'};
      render();
      let title = component.find('span').at(1);
      expect(title.hasClass('active')).toBe(true);
      expect(title.find('i').hasClass('fa-caret-down')).toBe(true);
    });
  });

  describe('when filtering creationDate property asc', () => {
    it('should set active recent with up arrow', () => {
      props.search = {order: 'asc', sort: 'creationDate'};
      render();
      let title = component.find('span').first();
      let recent = component.find('span').last();
      expect(title.hasClass('active')).toBe(false);
      expect(recent.hasClass('active')).toBe(true);
      expect(title.find('i').length).toBe(0);
      expect(recent.find('i').hasClass('fa-caret-up')).toBe(true);
    });
  });
});
