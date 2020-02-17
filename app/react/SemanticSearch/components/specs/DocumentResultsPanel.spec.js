import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import multiReducer from 'app/Multireducer';
import { actions as basicActions } from 'app/BasicReducer';
import actions from '../../actions';

import DocumentResultsPanel, { mapDispatchToProps, mapStateToProps } from '../DocumentResultsPanel';

describe('DocumentResultsPanel', () => {
  let state;
  let store;
  let localProps;
  let dispatch;

  beforeEach(() => {
    localProps = {
      storeKey: 'library',
    };
    dispatch = jest.fn().mockImplementation(() => Promise.resolve());
    spyOn(multiReducer, 'wrapDispatch').and.returnValue(dispatch);
    state = {
      templates: [],
      semanticSearch: {
        selectedDocument: Immutable.fromJS({ _id: 'sharedId' }),
      },
      library: {
        sidepanel: {
          references: [],
          tab: 'tab',
          metadata: [],
          metadataForm: {
            $form: { pristine: true },
          },
        },
        search: {
          searchTerm: 'search term',
        },
      },
    };
    store = {
      getState: jest.fn(() => state),
      subscribe: jest.fn(),
      dispatch,
    };
  });
  const render = () => shallow(<DocumentResultsPanel store={store} />);
  const getProps = () => ({
    ...mapDispatchToProps(dispatch, localProps),
    ...mapStateToProps(state, localProps),
  });

  it('should render DocumentSidePanel with the current semantic search document', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });

  it('should unselect semantic search document when panel is closed', () => {
    spyOn(actions, 'unselectSemanticSearchDocument');
    const props = getProps();
    props.closePanel();
    expect(actions.unselectSemanticSearchDocument).toHaveBeenCalled();
  });

  it('should set sidepanel tab when showTab is clicked', () => {
    spyOn(basicActions, 'set');
    const props = getProps();
    props.showTab('newTab');
    expect(basicActions.set).toHaveBeenCalledWith('library.sidepanel.tab', 'newTab');
  });
});
