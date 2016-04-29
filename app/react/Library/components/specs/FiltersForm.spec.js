import React from 'react';
import {mount} from 'enzyme';
import Immutable from 'immutable';

import {FiltersForm, mapStateToProps} from 'app/Library/components/FiltersForm';

describe('FiltersForm', () => {
  let wrapper;
  let props;

  beforeEach(() => {
    props = {
      searchDocuments: jasmine.createSpy('searchDocuments'),
      searchTerm: 'Find my document',
      fields: {author: {initialValue: 'Philip K. Dick'}},
      properties: [{name: 'author'}],
      handleSubmit: (callBack) => {
        callBack({author: 'Philip K. Dick'});
      }
    };
    wrapper = mount(<FiltersForm {...props}/>);
  });

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm', () => {
      wrapper.find('form').simulate('submit', {preventDefault: ()=>{}});
      expect(props.searchDocuments).toHaveBeenCalledWith(props.searchTerm, {author: 'Philip K. Dick'});
    });
  });

  describe('maped state', () => {
    it('should contain the searchTerm, fields and properties', () => {
      let store = {
        library: {
          ui: Immutable.fromJS({searchTerm: 'do a barrel roll'}),
          filters: Immutable.fromJS({properties: [{name: 'author'}]})
        },
        form: {
          filters: 'filtersForm'
        }
      };
      let state = mapStateToProps(store);
      expect(state.searchTerm).toBe('do a barrel roll');
      expect(state.fields).toEqual(['author']);
      expect(state.properties).toEqual([{name: 'author'}]);
    });
  });
});
