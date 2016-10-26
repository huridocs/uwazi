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
    templates = Immutable.fromJS([{name: 'decision'}, {name: 'ruling'}]);
    props = {
      templates,
      aggregations: Immutable.fromJS({types: {buckets: [{key: 'decision', doc_count: 2}]}}),
      filters: Immutable.fromJS({
        documentTypes: []
      }),
      searchTerm: 'Bruce Wayne',
      form: {isBatman: {value: true}},
      searchDocuments: jasmine.createSpy('searchDocuments'),
      search: {sort: 'title'}
    };
    component = shallow(<LibraryFilters {...props} />);
  });

  it('should render a MultiSelect to filter for all types and one for each document type', () => {
    let multiselect = component.find(MultiSelect);
    expect(multiselect.props().options).toEqual(templates.toJS());
  });

  describe('maped state', () => {
    it('should contain the filters store and the filters form', () => {
      let store = {
        library: {
          filters: Immutable.fromJS({properties: 'filters state', documentTypes: ['Decision']}),
          ui: Immutable.fromJS({searchTerm: 'Zerg Rush', filtersPanel: true}),
          aggregations: Immutable.fromJS({types: {buckets: []}})
        },
        templates: Immutable.fromJS([])
      };
      let state = mapStateToProps(store);
      expect(state).toEqual({
        filters: store.library.filters,
        searchTerm: 'Zerg Rush',
        open: true,
        templates: store.templates,
        aggregations: store.library.aggregations
      });
    });
  });
});
