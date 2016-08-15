import React from 'react';
import {shallow} from 'enzyme';
import configureMockStore from 'redux-mock-store';
import Immutable from 'immutable';

import ListContainer, {ConnectionsList} from 'app/Viewer/components/ConnectionsList';
import SidePanel from 'app/Layout/SidePanel';

describe('ConnectionsList', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      references: Immutable.fromJS([
        {_id: 'ref1', relationType: 'rel1', targetDocument: '1', range: {start: 10, end: 20}},
        {_id: 'ref2', relationType: 'rel1', targetDocument: '1', range: {start: 0, end: 8}},
        {_id: 'ref3', relationType: 'rel1', targetDocument: '1', range: {start: 5, end: 8}},
        {_id: 'ref4', relationType: 'rel1', targetDocument: '1', range: {text: ''}}
      ]),
      referencedDocuments: Immutable.fromJS([{title: 'doc1', _id: '1'}, {title: 'doc2', _id: '2'}]),
      relationTypes: Immutable.fromJS([{_id: 'rel1', name: 'Supports'}]),
      highlightReference: jasmine.createSpy('highlightReference'),
      activateReference: jasmine.createSpy('activateReference'),
      selectReference: jasmine.createSpy('selectReference'),
      deactivateReference: jasmine.createSpy('deactivateReference'),
      deleteReference: jasmine.createSpy('deleteReference'),
      closePanel: jasmine.createSpy('closePanel'),
      uiState: Immutable.fromJS({})
    };
  });

  let render = () => {
    component = shallow(<ConnectionsList {...props}/>);
  };

  it('should merge and render references in order with the proper document titles', () => {
    render();

    expect(component.find('.item').get(0).props['data-id']).toBe('ref4');
    expect(component.find('.item').get(1).props['data-id']).toBe('ref2');
    expect(component.find('.item').get(2).props['data-id']).toBe('ref3');
    expect(component.find('.item').get(3).props['data-id']).toBe('ref1');
  });

  it('should disable all-document connections if targetDocument', () => {
    props.targetDoc = true;
    render();

    expect(component.find('.item').get(0).props.className).toContain('disabled');
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

  describe('when click on a reference', () => {
    beforeEach(() => {
      props.uiState = Immutable.fromJS({
        reference: Immutable.fromJS({targetRange: 'targetRange'}),
        panel: 'ConnectionsList',
        activeReference: 'ref1'
      });
    });

    describe('when document is source document', () => {
      it('should activate it', () => {
        render();
        component.find('.item').last().simulate('click');
        expect(props.activateReference).toHaveBeenCalledWith('ref1');
        expect(component.find('.item').last().node.props.className).toContain('relationship-active');
      });
    });

    describe('when document is target document', () => {
      it('should select it', () => {
        props.targetDoc = true;
        render();
        component.find('.item').last().simulate('click');
        expect(props.selectReference).toHaveBeenCalledWith('ref1', props.references.toJS());
        expect(component.find('.item').last().node.props.className).toContain('relationship-selected');
      });

      describe('when connection is to the entire document', () => {
        it('should not select it', () => {
          props.targetDoc = true;
          render();
          component.find('.item').first().simulate('click');
          expect(props.selectReference).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('ListContainer', () => {
    let state = {
      documentViewer: {
        uiState: Immutable.fromJS({
          panel: ''
        }),
        references: Immutable.fromJS(['reference']),
        targetDoc: Immutable.fromJS({})
      }
    };

    const mockStore = configureMockStore([]);

    let renderContainer = () => {
      let store = mockStore(state);
      component = shallow(<ListContainer />, {context: {store}});
    };

    it('should should map props', () => {
      renderContainer();
      let containerProps = component.props();
      expect(containerProps.references).toEqual(state.documentViewer.references);
    });
  });
});
