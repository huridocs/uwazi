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
      references: Immutable.fromJS([
        {_id: 'ref1', relationType: 'rel1', targetDocument: '1', sourceRange: {start: 10, end: 20}, targetRange: {text: 'text 3'}},
        {_id: 'ref2', relationType: 'rel1', targetDocument: '1', sourceRange: {start: 4, end: 8}, targetRange: {text: 'text 4'}}]),
      inboundReferences: Immutable.fromJS([]),
      referencedDocuments: Immutable.fromJS([{title: 'doc1', _id: '1'}, {title: 'doc2', _id: '2'}]),
      relationTypes: Immutable.fromJS([{_id: 'rel1', name: 'Supports'}]),
      highlightReference: jasmine.createSpy('highlightReference'),
      activateReference: jasmine.createSpy('activateReference'),
      deactivateReference: jasmine.createSpy('deactivateReference'),
      deleteReference: jasmine.createSpy('deleteReference'),
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

  it('should merge and render references in order with the proper document titles', () => {
    props.inboundReferences = Immutable.fromJS([
      {_id: 'inboundRef1', relationType: 'rel1', sourceDocument: '2', targetRange: {start: 1, end: 2}, sourceRange: {text: 'text 1'}},
      {_id: 'inboundRef2', relationType: 'rel1', sourceDocument: '2', targetRange: {start: 11, end: 22}, sourceRange: {text: 'text 2'}},
      {_id: 'inboundRef3', relationType: 'rel1', sourceDocument: '2'}
    ]);

    render();

    expect(component.find('.item').get(0).props['data-id']).toBe('inboundRef3');
    expect(component.find('.item').at(0).text()).toContain('doc2');

    expect(component.find('.item').get(1).props['data-id']).toBe('inboundRef1');
    expect(component.find('.item').at(1).text()).toContain('doc2');
    expect(component.find('.item').at(1).text()).toContain('text 1');

    expect(component.find('.item').get(2).props['data-id']).toBe('ref2');
    expect(component.find('.item').at(2).text()).toContain('doc1');
    expect(component.find('.item').at(2).text()).toContain('text 4');

    expect(component.find('.item').get(3).props['data-id']).toBe('ref1');
    expect(component.find('.item').at(3).text()).toContain('doc1');
    expect(component.find('.item').at(3).text()).toContain('text 3');

    expect(component.find('.item').get(4).props['data-id']).toBe('inboundRef2');
    expect(component.find('.item').at(4).text()).toContain('doc2');
    expect(component.find('.item').at(4).text()).toContain('text 2');
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
      component.find('.item').last().simulate('mouseenter');
      expect(props.highlightReference).toHaveBeenCalledWith('ref1');
    });
  });

  describe('when mouseleave a reference', () => {
    it('should unhighlightReference', () => {
      render();
      component.find('.item').last().simulate('mouseleave');
      expect(props.highlightReference).toHaveBeenCalledWith(null);
    });
  });

  describe('when click a reference', () => {
    it('should activate it', () => {
      render();
      component.find('.item').last().simulate('click');
      expect(props.activateReference).toHaveBeenCalledWith('ref1');
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
        references: Immutable.fromJS(['reference']),
        targetDoc: Immutable.fromJS({}),
        inboundReferences: Immutable.fromJS(['inboundReference'])
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
      expect(containerProps.inboundReferences).toEqual(state.documentViewer.inboundReferences);
    });
  });
});
