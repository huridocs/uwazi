import React from 'react';
import {mount} from 'enzyme';
import Immutable from 'immutable';

import {SearchBar, mapStateToProps} from 'app/Library/components/SearchBar';

describe('SearchBar', () => {
  let component;
  let props = jasmine.createSpyObj(['searchDocuments', 'setSearchTerm', 'getSuggestions']);
  props.searchTerm = 'Find my document';
  props.suggestions = [];

  beforeEach(() => {
    component = mount(<SearchBar {...props}/>);
  });

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm', () => {
      component.find('form').simulate('submit', {preventDefault: ()=>{}});
      expect(props.searchDocuments).toHaveBeenCalledWith(props.searchTerm);
    });
  });

  describe('inout on change', () => {
    it('should call setSearchTerm', () => {
      component.find('input').simulate('change');
      expect(props.setSearchTerm).toHaveBeenCalledWith('Find my document');
    });

    it('should call debounced function getSuggestions', () => {
      jasmine.clock().install();
      component.find('input').simulate('change');
      jasmine.clock().tick(400);
      expect(props.getSuggestions).toHaveBeenCalledWith('Find my document');
      jasmine.clock().uninstall();
    });
  });

  describe('the x in the input', () => {
    it('should empty searchTerm', () => {
      component.find('.input-group-btn').simulate('click');
      expect(props.setSearchTerm).toHaveBeenCalledWith('');
    });
  });

  describe('maped state', () => {
    it('should contain the searchTerm', () => {
      let store = {
        library: {
          ui: Immutable.fromJS({searchTerm: 'do a barrel roll'})
        }
      };
      let state = mapStateToProps(store);
      expect(state).toEqual({searchTerm: 'do a barrel roll'});
    });
  });
});
