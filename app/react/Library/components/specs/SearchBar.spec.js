import React from 'react';
import {mount} from 'enzyme';
import Immutable from 'immutable';

import {SearchBar, mapStateToProps} from 'app/Library/components/SearchBar';

describe('SearchBar', () => {
  let warpper;
  let props;

  beforeEach(() => {
    props = jasmine.createSpyObj(['searchDocuments', 'setSearchTerm', 'getSuggestions', 'hideSuggestions', 'setOverSuggestions']);
    props.searchTerm = 'Find my document';
    props.suggestions = [];
    warpper = mount(<SearchBar {...props}/>);
  });

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm', () => {
      warpper.find('form').simulate('submit', {preventDefault: ()=>{}});
      expect(props.searchDocuments).toHaveBeenCalledWith(props.searchTerm);
    });
  });

  describe('inout', () => {
    describe('onChange', () => {
      it('should call setSearchTerm', () => {
        warpper.find('input').simulate('change');
        expect(props.setSearchTerm).toHaveBeenCalledWith('Find my document');
      });

      it('should call debounced function getSuggestions', () => {
        jasmine.clock().install();
        warpper.find('input').simulate('change');
        jasmine.clock().tick(400);
        expect(props.getSuggestions).toHaveBeenCalledWith('Find my document');
        jasmine.clock().uninstall();
      });
    });

    describe('onBlur', () => {
      it('should call hideSuggestions', () => {
        warpper.find('input').simulate('blur');
        expect(props.hideSuggestions).toHaveBeenCalled();
      });
    });
  });

  describe('suggestions', () => {
    describe('onMouseOver', () => {
      it('should call setOverSuggestions with TRUE', () => {
        warpper.find('.search-suggestions').simulate('mouseOver');
        expect(props.setOverSuggestions).toHaveBeenCalledWith(true);
      });
    });

    describe('onMouseLeave', () => {
      it('should call setOverSuggestions with FALSE', () => {
        warpper.find('.search-suggestions').simulate('mouseLeave');
        expect(props.setOverSuggestions).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('the x in the input', () => {
    it('should empty searchTerm', () => {
      warpper.find('.input-group-btn').simulate('click');
      expect(props.setSearchTerm).toHaveBeenCalledWith('');
    });
  });

  describe('warpperWillUnmount', () => {
    it('should reset the searchTerm', () => {
      warpper.component.getInstance().componentWillUnmount();
      expect(props.setSearchTerm).toHaveBeenCalledWith('');
      expect(props.setOverSuggestions).toHaveBeenCalledWith(false);
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
