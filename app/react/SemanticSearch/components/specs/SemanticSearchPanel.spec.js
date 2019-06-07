import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { SemanticSearchSidePanel, mapStateToProps, mapDispatchToProps } from '../SemanticSearchPanel';
import * as actions from '../../actions/actions';

describe('SemanticSearchPanel', () => {
  let initialState;
  let initialProps;
  let dispatch;
  beforeEach(() => {
    initialState = {
      library: {
        search: { filters: { prop1: { values: ['value1'] }, prop2: {} } },
        filters: Immutable.fromJS({
          documentTypes: ['type1']
        }),
        ui: {
          selectedDocuments: [],
          showSemanticSearchPanel: true
        }
      },
      semanticSearch: {
        searches: Immutable.fromJS([])
      }
    };
    initialProps = {
      storeKey: 'library'
    };
    jest.spyOn(actions, 'fetchSearches').mockResolvedValue([
      { searchTerm: 'search1' },
      { searchTerm: 'search2' }
    ]);
    jest.spyOn(actions, 'submitNewSearch');
    dispatch = jest.fn();
  });

  const getProps = () => {
    const library = {
      ...initialState.library,
      ui: Immutable.fromJS(initialState.library.ui)
    };
    const state = {
      ...initialState,
      library
    };
    return {
      ...mapStateToProps(state, initialProps),
      ...mapDispatchToProps(dispatch),
      open: true
    };
  };
  const render = () => shallow(<SemanticSearchSidePanel {...getProps()} />);
  it('should fetch all searches when mounted', (done) => {
    render();
    setImmediate(() => {
      expect(actions.fetchSearches).toHaveBeenCalled();
      done();
    });
  });
  it('should render SearchList with searches from the state', () => {
    initialState.semanticSearch.searches = Immutable.fromJS([
      { searchTerm: 'search1' },
      { searchTerm: 'search2' }
    ]);
    const component = render();
    expect(component).toMatchSnapshot();
  });
  it('should submit new search based on library filters when form is submitted', () => {
    const component = render();
    component.find('.semantic-search-form').simulate('submit', { searchTerm: 'test' });
    expect(actions.submitNewSearch).toHaveBeenCalledWith({
      searchTerm: 'test',
      query: {
        filters: { prop1: { values: ['value1'] } },
        types: ['type1']
      }
    });
  });
});
