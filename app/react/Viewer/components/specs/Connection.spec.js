import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { Connection } from 'app/Viewer/components/Connection';
import { Item } from 'app/Layout';

describe('Connection', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      reference: {
        _id: 'ref1',
        relationType: 'rel1',
        associatedRelationship: { entityData: { _id: '1' } },
        reference: { selectionRectangles: [], text: 'hello' },
      },
      referencedDocuments: Immutable.fromJS([
        { title: 'doc1', _id: '1' },
        { title: 'doc2', _id: '2' },
      ]),
      relationTypes: Immutable.fromJS([{ _id: 'rel1', name: 'Supports' }]),
      highlightReference: jasmine.createSpy('highlightReference'),
      activateReference: jasmine.createSpy('activateReference'),
      selectReference: jasmine.createSpy('selectReference'),
      deactivateReference: jasmine.createSpy('deactivateReference'),
      deleteReference: jasmine.createSpy('deleteReference'),
      toggleReferences: jasmine.createSpy('toggleReferences'),
      active: true,
      highlighted: false,
    };
  });

  const render = () => {
    component = shallow(<Connection {...props} />);
  };

  it('should render the reference', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should disable all-document connections if targetDocument', () => {
    props.targetDoc = true;
    delete props.reference.reference;
    render();

    expect(component.find(Item).get(0).props.className).toContain('disabled');
  });

  describe('when mouseenter on a reference', () => {
    it('should highlightReference', () => {
      render();
      component.find(Item).last().simulate('mouseenter');
      expect(props.highlightReference).toHaveBeenCalledWith('ref1');
    });
  });

  describe('when mouseleave a reference', () => {
    it('should unhighlightReference', () => {
      render();
      component.find(Item).last().simulate('mouseleave');
      expect(props.highlightReference).toHaveBeenCalledWith(null);
    });
  });

  describe('when click on a reference', () => {
    beforeEach(() => {
      props.uiState = Immutable.fromJS({
        reference: Immutable.fromJS({ targetRange: 'targetRange' }),
        panel: 'ConnectionsList',
        activeReference: 'ref1',
      });
      props.referencesSection = 'tabName';
    });

    describe('when document is source document', () => {
      it('should activate it and set refences click action active', () => {
        render();
        component.find(Item).simulate('click');
        expect(props.activateReference).toHaveBeenCalledWith(props.reference, 'tabName');
        expect(props.toggleReferences).toHaveBeenCalledWith(true);
        expect(component.find(Item).props().className).toContain('relationship-active');
      });

      describe('when readOnly', () => {
        it('should not activate it', () => {
          props.readOnly = true;
          render();
          component.find(Item).last().simulate('click');
          expect(props.activateReference).not.toHaveBeenCalled();
          expect(props.toggleReferences).not.toHaveBeenCalled();
          expect(component.find(Item).props().className).not.toContain('relationship-active');
        });
      });
    });

    describe('when document is target document', () => {
      it('should select it', () => {
        props.targetDoc = true;
        props.targetRange = {};
        render();
        component.find(Item).last().simulate('click');
        expect(props.selectReference).toHaveBeenCalledWith(props.reference);
        expect(component.find(Item).last().getElements()[0].props.className).toContain(
          'relationship-selected'
        );
      });

      describe('when connection is to the entire document', () => {
        it('should not select it', () => {
          props.targetDoc = true;
          delete props.reference.reference;
          render();
          component.find(Item).first().simulate('click');
          expect(props.selectReference).not.toHaveBeenCalled();
        });
      });
    });
  });
});
