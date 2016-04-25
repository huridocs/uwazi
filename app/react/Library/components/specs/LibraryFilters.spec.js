import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {LibraryFilters, mapStateToProps} from 'app/Library/components/LibraryFilters';

describe('LibraryFilters', () => {
  let component;
  let templates;
  let props;

  beforeEach(() => {
    templates = [{name: 'Decision'}, {name: 'Ruling'}];
    props = {templates, documentTypes: {}};
    component = shallow(<LibraryFilters {...props} />);
  });

  it('should render a checkbox to filter for all types and one for each document type', () => {
    let docs = component.find('input[type="checkbox"]');
    expect(docs.length).toBe(3);
  });

  describe('maped state', () => {
    it('should contain the filters store', () => {
      let store = {
        library: {
          filters: Immutable.fromJS(['filters state'])
        }
      };
      let state = mapStateToProps(store);
      expect(state).toEqual(['filters state']);
    });
  });
});
