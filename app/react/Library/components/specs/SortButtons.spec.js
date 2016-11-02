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
      search: {order: 'desc', sort: 'title'},
      templates: immutable([
        {properties: [{}, {sortable: true, name: 'sortable_name', label: 'sortableProperty', type: 'text'}]}
      ])
    };
  });

  describe('Sort options', () => {
    it('should use templates sortable properties as options', () => {
      render();
      expect(component.find('li').length).toBe(3);
      expect(component.find('li').last().text()).toBe('sortableProperty');
    });

    describe('when multiple options have the same name', () => {
      it('should not duplicate the entry', () => {
        props.templates = immutable([
          {properties: [{}, {sortable: true, name: 'sortable_name', label: 'sortableProperty', type: 'text'}]},
          {properties: [{sortable: true, name: 'sortable_name', label: 'anotherLabel', type: 'text'}]}
        ]);
        render();

        expect(component.find('li').length).toBe(3);
        expect(component.find('li').last().text()).toBe('sortableProperty');
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
        component.setState({active: true});
        component.find('li').last().simulate('click');
        expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'metadata.sortable_name', order: 'asc'});

        const templates = props.templates.toJS();
        templates[0].properties[1].type = 'date';
        props.templates = immutable(templates);

        render();

        component.find('li').last().simulate('click');
        expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'metadata.sortable_name', order: 'desc'});
      });
    });
  });

  describe('sort', () => {
    it('should merge with searchTerm and filtersForm and toggle between asc/desc', () => {
      render();
      instance.sort('title');
      expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'title', order: 'asc'});

      props.search.order = 'asc';
      render();
      instance.sort('title');
      expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'title', order: 'desc'});
      expect(props.merge).toHaveBeenCalledWith('search', {sort: 'title', order: 'desc'});
    });

    describe('when changing property being sorted', () => {
      it('should use default order', () => {
        props.search = {order: 'desc', sort: 'title'};
        render();
        instance.sort('title');
        expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'title', order: 'asc'});

        props.searchDocuments.calls.reset();
        props.search = {order: 'desc', sort: 'title'};
        render();
        instance.sort('creationDate', 'desc');
        expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'creationDate', order: 'desc'});

        props.searchDocuments.calls.reset();
        props.search = {order: 'desc', sort: 'title'};
        render();
        instance.sort('creationDate', 'asc');
        expect(props.searchDocuments).toHaveBeenCalledWith({sort: 'creationDate', order: 'asc'});
      });
    });
  });

  describe('when filtering title property', () => {
    it('should set active title', () => {
      props.search = {order: 'asc', sort: 'title'};
      render();
      let title = component.find('li').at(0);
      expect(title.hasClass('is-active')).toBe(true);
    });
  });

  describe('when filtering creationDate property asc', () => {
    it('should set active recent', () => {
      props.search = {order: 'asc', sort: 'creationDate'};
      render();
      let title = component.find('li').at(0);
      let recent = component.find('li').at(1);
      expect(title.hasClass('is-active')).toBe(false);
      expect(recent.hasClass('is-active')).toBe(true);
    });
  });
});
