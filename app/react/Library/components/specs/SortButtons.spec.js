import React from 'react';
import {shallow} from 'enzyme';

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
      filtersForm: {isBatman: {value: true}},
      searchTerm: 'searchTerm'
    };
  });

  describe('sort', () => {
    it('should merge with searchTerm and filtersForm and toggle between asc/desc', () => {
      render();
      instance.sort('title');
      expect(props.searchDocuments).toHaveBeenCalledWith('searchTerm', {isBatman: true, sort: 'title', order: 'asc'});

      props.search.order = 'asc';
      render();
      instance.sort('title');
      expect(props.searchDocuments).toHaveBeenCalledWith('searchTerm', {isBatman: true, sort: 'title', order: 'desc'});
      expect(props.merge).toHaveBeenCalledWith('search', {sort: 'title', order: 'desc'});
    });

    describe('when changing property being sort', () => {
      it('should maintain order for the first sort and then toggle it', () => {
        props.search = {order: 'desc', sort: 'title'};
        render();
        instance.sort('title');
        expect(props.searchDocuments).toHaveBeenCalledWith('searchTerm', {isBatman: true, sort: 'title', order: 'asc'});

        props.searchDocuments.calls.reset();
        props.search = {order: 'asc', sort: 'title'};
        render();
        instance.sort('creationDate');
        expect(props.searchDocuments).toHaveBeenCalledWith('searchTerm', {isBatman: true, sort: 'creationDate', order: 'asc'});
      });
    });
  });

  describe('when filtering title property asc', () => {
    it('should set active title with down arrow', () => {
      props.search = {order: 'asc', sort: 'title'};
      render();
      let title = component.find('span').first();
      expect(title.hasClass('active')).toBe(true);
      expect(title.find('i').hasClass('fa-caret-down')).toBe(true);
    });
  });

  describe('when filtering title property desc', () => {
    it('should set active title with down arrow', () => {
      props.search = {order: 'desc', sort: 'title'};
      render();
      let title = component.find('span').first();
      expect(title.hasClass('active')).toBe(true);
      expect(title.find('i').hasClass('fa-caret-up')).toBe(true);
    });
  });

  describe('when filtering creationDate property asc', () => {
    it('should set active recent with down arrow', () => {
      props.search = {order: 'asc', sort: 'creationDate'};
      render();
      let title = component.find('span').first();
      let recent = component.find('span').last();
      expect(title.hasClass('active')).toBe(false);
      expect(recent.hasClass('active')).toBe(true);
      expect(title.find('i').length).toBe(0);
      expect(recent.find('i').hasClass('fa-caret-down')).toBe(true);
    });
  });
});
