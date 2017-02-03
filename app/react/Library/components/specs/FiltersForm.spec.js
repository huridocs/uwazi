import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';
import {Form} from 'react-redux-form';

import {FiltersForm, mapStateToProps} from 'app/Library/components/FiltersForm';

describe('FiltersForm', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      searchDocuments: jasmine.createSpy('searchDocuments'),
      fields: Immutable([{author: {initialValue: 'Philip K. Dick'}}]),
      documentTypes: Immutable({}),
      templates: [],
      aggregations: Immutable({}),
      search: {searchTerm: 'Batman'}
    };
    component = shallow(<FiltersForm {...props}/>);
  });

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm', () => {
      component.find(Form).simulate('submit', {myfilter: true});
      expect(props.searchDocuments).toHaveBeenCalledWith({myfilter: true});
    });
  });

  describe('maped state', () => {
    it('should contain the fields', () => {
      let store = {
        library: {
          ui: Immutable({searchTerm: 'do a barrel roll'}),
          filters: Immutable({properties: [{name: 'author'}], documentTypes: {a: true}})
        },
        form: {
          filters: 'filtersForm'
        },
        templates: Immutable([])
      };
      let state = mapStateToProps(store);
      expect(state.fields.toJS()).toEqual([{name: 'author'}]);
      expect(state.documentTypes.toJS()).toEqual({a: true});
    });
  });
});
