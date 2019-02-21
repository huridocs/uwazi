import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { SemanticSearchSidePanel, mapStateToProps } from '../SemanticSearchPanel';
import api from '../../SemanticSearchAPI';

describe('SemanticSearchPanel', () => {
  let initialState;
  let initialProps;
  beforeEach(() => {
    initialState = {
      library: {
        search: { query: 'library search'},
        ui: {
          selectedDocuments: [],
          showSemanticSearchPanel: true
        }
      }
    };
    initialProps = {
      storeKey: 'library'
    };
    jest.spyOn(api, 'getAllSearches').mockResolvedValue([
      { searchTerm: 'search1' },
      { searchTerm: 'search2' }
    ]);
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
    return mapStateToProps(state, initialProps);
  };
  const render = () => shallow(<SemanticSearchSidePanel {...getProps()} />);
  it('should fetch all searches when mounted', (done) => {
    render();
    setImmediate(() => {
      expect(api.getAllSearches).toHaveBeenCalled();
      done();
    });
  });
  it('should render SearchList with fetched searches', (done) => {
    const component = render();
    setImmediate(() => {
      expect(component.update()).toMatchSnapshot(done);
      done();
    });
  });
  it('should render new search form when search button is clicked', () => {
    const component = render();
    component.find('.new-search').simulate('click');
    expect(component.update()).toMatchSnapshot();
  });
  describe('when on new search form', () => {
    it('should go back to search list page when the cancel button is clicked', () => {
      const component = render();
      component.setState({ page: 'new', searches: [] });
      component.find('.cancel-search').simulate('click');
      expect(component.update()).toMatchSnapshot();
    });
  });
});
