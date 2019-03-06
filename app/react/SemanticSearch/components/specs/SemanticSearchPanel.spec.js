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
        search: { query: 'library search' },
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
  it('should render new search form when search button is clicked', () => {
    const component = render();
    component.find('.new-search').simulate('click');
    expect(component.update()).toMatchSnapshot();
  });
});
