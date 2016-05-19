import React from 'react';
import {shallow} from 'enzyme';
import configureMockStore from 'redux-mock-store';
import Immutable from 'immutable';
import {helpers} from 'app/Documents';

import PanelContainer, {ViewMetadataPanel} from 'app/Viewer/components/ViewMetadataPanel';
import SidePanel from 'app/Layout/SidePanel';

describe('ViewMetadataPanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      doc: {metadata: []}
    };
  });

  let render = () => {
    component = shallow(<ViewMetadataPanel {...props}/>);
  };

  it('should render a SidePanel', () => {
    render();

    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBeUndefined();
  });

  describe('when props.open', () => {
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
        }),
        document: {},
        references: Immutable.fromJS(['reference']),
        templates: Immutable.fromJS(['template']),
        thesauris: Immutable.fromJS(['thesauris'])
      }
    };

    const mockStore = configureMockStore([]);

    let renderContainer = () => {
      spyOn(helpers, 'prepareMetadata');
      let store = mockStore(state);
      component = shallow(<PanelContainer />, {context: {store}});
    };

    it('should prepare doc with template and thesauris', () => {
      renderContainer();
      expect(helpers.prepareMetadata).toHaveBeenCalledWith(
        state.documentViewer.document,
        state.documentViewer.templates.toJS(),
        state.documentViewer.thesauris.toJS()
      );
    });

    it('should be closed when panel is not viewMetadataPanel', () => {
      renderContainer();
      expect(component.props().open).toBe(false);
    });

    it('should be open when panel is ViewMetadataPanel', () => {
      state.documentViewer.uiState = state.documentViewer.uiState.set('panel', 'viewMetadataPanel');
      renderContainer();
      expect(component.props().open).toBe(true);
    });
  });
});
