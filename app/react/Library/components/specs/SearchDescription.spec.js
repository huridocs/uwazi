import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import libraryHelpers from 'app/Library/helpers/libraryFilters';

import { SearchDescription } from 'app/Library/components/SearchDescription';
import { mapStateToProps } from '../SearchDescription';

describe('SearchDescription', () => {
  let searchTerm;
  let query;
  let properties;
  let state;

  beforeEach(() => {
    searchTerm = 'test';
    query = {
      filters: { p1: { values: ['p1v1', 'p1v2'] }, p2: { values: ['p2v1'] }, p4: { from: 3243 } },
      types: ['t1'],
    };
    properties = [
      {
        name: 'p1',
        label: 'Prop 1',
        options: [
          { id: 'p1v1', label: 'Prop 1 Val 1' },
          { id: 'p1v2', label: 'Prop 2 Val 2' },
        ],
      },
      {
        name: 'p2',
        label: 'Prop 2',
        options: [
          { id: 'p2v1', label: 'Prop 2 Val 1' },
          { id: 'p2v2', label: 'Prop 2 Val 2' },
        ],
      },
      {
        name: 'p3',
        label: 'Prop 3',
        options: [{ id: 'p3v1', label: 'Prop 3 Val 1' }],
      },
      {
        name: 'p4',
        label: 'Prop 4',
      },
    ];
    state = {
      templates: Immutable.fromJS(['templates']),
      thesauris: Immutable.fromJS(['thesauri']),
      relationTypes: Immutable.fromJS(['relationTypes']),
    };
    jest.spyOn(libraryHelpers, 'URLQueryToState').mockReturnValue({
      properties,
    });
  });

  const render = () =>
    shallow(<SearchDescription searchTerm={searchTerm} query={query} properties={properties} />);

  it('should generate description based on property filters', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });

  it('should only display search term if query is not provided', () => {
    query = undefined;
    const component = render();
    expect(component).toMatchSnapshot();
  });

  describe('mapStateToProps', () => {
    beforeEach(() => {});
    it('should get properties from templates, thesauri and relation types', () => {
      const props = mapStateToProps(state, { query });
      expect(libraryHelpers.URLQueryToState).toHaveBeenCalledWith(query, ['templates']);
      expect(props.properties).toEqual(properties);
    });
    it('should not get properties if query is not provided', () => {
      libraryHelpers.URLQueryToState.mockClear();
      query = undefined;
      const props = mapStateToProps(state, { query });
      expect(libraryHelpers.URLQueryToState).not.toHaveBeenCalled();
      expect(props.properties).toEqual([]);
    });
  });
});
