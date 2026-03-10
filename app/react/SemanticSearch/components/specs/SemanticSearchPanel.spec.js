/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { socket } from 'app/socket';

import {
  SemanticSearchSidePanel,
  mapStateToProps,
  mapDispatchToProps,
} from '../SemanticSearchPanel';
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
          documentTypes: ['type1'],
        }),
        ui: {
          selectedDocuments: [],
          showSemanticSearchPanel: true,
        },
      },
      semanticSearch: {
        searches: Immutable.fromJS([]),
      },
    };
    initialProps = {
      storeKey: 'library',
    };
    jest
      .spyOn(actions, 'fetchSearches')
      .mockResolvedValue([{ searchTerm: 'search1' }, { searchTerm: 'search2' }]);
    jest.spyOn(actions, 'submitNewSearch');
    jest.spyOn(actions, 'updateSearch').mockReturnValue();
    jest.spyOn(actions, 'hideSemanticSearch').mockReturnValue();
    jest.spyOn(actions, 'registerForUpdates').mockReturnValue();
    spyOn(socket, 'on');
    spyOn(socket, 'removeListener');
    dispatch = jest.fn();
  });

  const getProps = () => {
    const library = {
      ...initialState.library,
      ui: Immutable.fromJS(initialState.library.ui),
    };
    const state = {
      ...initialState,
      library,
    };
    return {
      ...mapStateToProps(state, initialProps),
      ...mapDispatchToProps(dispatch),
      open: true,
    };
  };
  const render = () => shallow(<SemanticSearchSidePanel {...getProps()} />);

  describe('real time semantic search updates', () => {
    it('should set onSearchUpdated as listener for semantic search updates', () => {
      const component = render();
      expect(socket.on).toHaveBeenCalledWith(
        'semanticSearchUpdated',
        component.instance().onSearchUpdated
      );
    });

    it('should stop listening to updates when unmounted', () => {
      const component = render();
      component.instance().componentWillUnmount();
      expect(socket.removeListener).toHaveBeenCalledWith(
        'semanticSearchUpdated',
        component.instance().onSearchUpdated
      );
    });
  });

  it('should fetch all searches when mounted', done => {
    render();
    setTimeout(() => {
      expect(actions.fetchSearches).toHaveBeenCalled();
      done();
    }, 0);
  });

  it('should register for updates when mounted the first time', () => {
    const component = render();
    expect(actions.registerForUpdates).toHaveBeenCalled();
    actions.registerForUpdates.mockReset();
    component.update();
    expect(actions.registerForUpdates).not.toHaveBeenCalled();
  });

  it('should render SearchList with searches from the state', () => {
    initialState.semanticSearch.searches = Immutable.fromJS([
      { searchTerm: 'search1' },
      { searchTerm: 'search2' },
    ]);
    const component = render();
    expect(component).toMatchSnapshot();
  });

  describe('onSearchUpdated', () => {
    it('should call updateSearch with updated search', () => {
      const event = { updatedSearch: 'search update' };
      const component = render();
      component.instance().onSearchUpdated(event);
      expect(actions.updateSearch).toHaveBeenCalledWith('search update');
    });
  });
});
