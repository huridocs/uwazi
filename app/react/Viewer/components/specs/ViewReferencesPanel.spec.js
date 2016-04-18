import React from 'react';
import {shallow} from 'enzyme';
import configureMockStore from 'redux-mock-store';
import Immutable from 'immutable';

import PanelContainer, {ViewReferencesPanel} from 'app/Viewer/components/ViewReferencesPanel';
import SidePanel from 'app/Layout/SidePanel';

describe('ViewReferencesPanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      results: []
    };
  });

  let render = () => {
    component = shallow(<ViewReferencesPanel {...props}/>);
  };

  it('should render a SidePanel', () => {
    render();

    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBeUndefined();
  });

  describe('when props.referencePanel', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();

      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });

  describe('PanelContainer', () => {
    let state = {
      documentViewer: {
        uiState: Immutable.fromJS({
          panel: ''
        })
      }
    };

    const mockStore = configureMockStore([]);

    let renderContainer = () => {
      let store = mockStore(state);
      component = shallow(<PanelContainer />, {context: {store}});
    };

    it('should be closed when panel is not ViewReferencesPanel', () => {
      renderContainer();
      expect(component.props().open).toBe(false);
    });

    it('should be open when panel is ViewReferencesPanel', () => {
      state.documentViewer.uiState.set('panel', 'viewReferencesPanel');
      renderContainer();
      expect(component.props().open).toBe(false);
    });
  });
});
