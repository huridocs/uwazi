import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';
import {Form} from 'react-redux-form';

import {SearchBar, mapStateToProps} from 'app/Library/components/SearchBar';

describe('SearchBar', () => {
  let component;
  let props;

  beforeEach(() => {
    props = jasmine.createSpyObj(['searchDocuments', 'change', 'getSuggestions', 'hideSuggestions', 'setOverSuggestions']);
    props.suggestions = Immutable.fromJS([]);
    props.search = {searchTerm: 'Find my document', sort: 'title', filters: {isBatman: true}};
    component = shallow(<SearchBar {...props}/>);
  });

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm filters and sort', () => {
      component.find(Form).simulate('submit', 'SEARCH MODEL VALUES');
      expect(props.searchDocuments).toHaveBeenCalledWith('SEARCH MODEL VALUES');
    });
  });

  describe('input', () => {
    describe('onChange', () => {
      it('should call debounced function getSuggestions', () => {
        jasmine.clock().install();
        component.find('input').simulate('change', {target: {value: 'Find my document'}});
        jasmine.clock().tick(400);
        expect(props.getSuggestions).toHaveBeenCalledWith('Find my document');
        jasmine.clock().uninstall();
      });
    });

    describe('onBlur', () => {
      it('should call hideSuggestions', () => {
        component.find('input').simulate('blur');
        expect(props.hideSuggestions).toHaveBeenCalled();
      });
    });
  });

  describe('suggestions', () => {
    describe('onMouseOver', () => {
      it('should call setOverSuggestions with TRUE', () => {
        component.find('.search-suggestions').simulate('mouseOver');
        expect(props.setOverSuggestions).toHaveBeenCalledWith(true);
      });
    });

    describe('onMouseLeave', () => {
      it('should call setOverSuggestions with FALSE', () => {
        component.find('.search-suggestions').simulate('mouseLeave');
        expect(props.setOverSuggestions).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('componentWillUnmount', () => {
    it('should reset the searchTerm', () => {
      component.instance().componentWillUnmount();
      expect(props.setOverSuggestions).toHaveBeenCalledWith(false);
    });
  });

  describe('maped state', () => {
    it('should contain the searchTerm', () => {
      let store = {
        search: 'search',
        library: {
          ui: Immutable.fromJS({filtersPanel: true, suggestions: 'suggestions', showSuggestions: true, overSuggestions: true})
        }
      };
      let state = mapStateToProps(store);
      expect(state).toEqual({open: true, search: 'search', suggestions: 'suggestions', showSuggestions: true, overSuggestions: true});
    });
  });
});
