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
      references: Immutable.fromJS([{_id: 'ref1', relationType: 'rel1'}, {_id: 'ref2', relationType: 'rel1'}]),
      referencedDocuments: Immutable.fromJS([]),
      relationTypes: Immutable.fromJS([{_id: 'rel1', name: 'Supports'}]),
      highlightReference: jasmine.createSpy('highlightReference'),
      activateReference: jasmine.createSpy('activateReference'),
      deactivateReference: jasmine.createSpy('deactivateReference'),
      closePanel: jasmine.createSpy('closePanel'),
      uiState: Immutable.fromJS({})
    };
  });

  let render = () => {
    component = shallow(<ViewReferencesPanel {...props}/>);
  };

  it('should render a SidePanel', () => {
    render();

    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBe(false);
  });

  describe('on Close panel', () => {
    it('should close panel and deactivate reference', () => {
      render();

      component.find('.close-modal').simulate('click');
      expect(props.closePanel).toHaveBeenCalled();
      expect(props.deactivateReference).toHaveBeenCalled();
    });
  });

  describe('when mouseenter on a reference', () => {
    it('should should highlightReference', () => {
      render();
      component.find('li').last().simulate('mouseenter');
      expect(props.highlightReference).toHaveBeenCalledWith('ref2');
    });
  });

  describe('when mouseleave a reference', () => {
    it('should unhighlightReference', () => {
      render();
      component.find('li').last().simulate('mouseleave');
      expect(props.highlightReference).toHaveBeenCalledWith(null);
    });
  });

  describe('when click a reference', () => {
    it('should activate it', () => {
      render();
      component.find('li').last().simulate('click');
      expect(props.activateReference).toHaveBeenCalledWith('ref2');
    });
  });

  describe('when props.referencePanel', () => {
    it('should open SidePanel', () => {
      props.uiState = Immutable.fromJS({panel: 'viewReferencesPanel'});
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
        references: Immutable.fromJS(['reference'])
      }
    };

    const mockStore = configureMockStore([]);

    let renderContainer = () => {
      let store = mockStore(state);
      component = shallow(<PanelContainer />, {context: {store}});
    };

    it('should should map props', () => {
      renderContainer();
      let containerProps = component.props();
      expect(containerProps.references).toEqual(state.documentViewer.references);
    });
  });
});
