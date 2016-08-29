import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {LibraryFilters, mapStateToProps} from 'app/Library/components/LibraryFilters';
import {MultiSelect} from 'app/Forms';

describe('LibraryFilters', () => {
  let component;
  let templates;
  let props;

  beforeEach(() => {
    templates = [{name: 'Decision'}, {name: 'Ruling'}];
    props = {
      templates,
      documentTypes: [],
      searchTerm: 'Bruce Wayne',
      form: {isBatman: {value: true}},
      searchDocuments: jasmine.createSpy('searchDocuments'),
      search: {sort: 'title'}
    };
    component = shallow(<LibraryFilters {...props} />);
  });

  it('should render a MultiSelect to filter for all types and one for each document type', () => {
    let multiselect = component.find(MultiSelect);
    expect(multiselect.props().options).toEqual(templates);
  });

  describe('maped state', () => {
    it('should contain the filters store and the filters form', () => {
      let store = {
        library: {
          filters: Immutable.fromJS({properties: 'filters state', documentTypes: ['Decision']}),
          ui: Immutable.fromJS({searchTerm: 'Zerg Rush', filtersPanel: true})
        }
      };
      let state = mapStateToProps(store);
      expect(state).toEqual({properties: 'filters state', searchTerm: 'Zerg Rush', documentTypes: ['Decision'], open: true});
    });
  });
});
