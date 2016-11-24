import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {mapStateToProps} from '../Doc';
import {Doc} from '../Doc';
import {Item} from 'app/Layout';

describe('Doc', () => {
  let component;
  let props = {};

  beforeEach(() => {
    props = {
      doc: Immutable({_id: 'idOne', template: 'templateId', creationDate: 1234, type: 'document', sharedId: 'id'}),
      active: false,
      selectDocument: jasmine.createSpy('selectDocument'),
      unselectDocument: jasmine.createSpy('unselectDocument')
    };
  });

  let render = () => {
    component = shallow(<Doc {...props}/>);
  };

  describe('Item data', () => {
    it('should hold the entire Doc as Immutable', () => {
      render();
      expect(component.find(Item).props().doc).toEqual(Immutable(props.doc));
    });

    it('should hold a link to the document', () => {
      render();
      const button = component.find(Item).props().buttons;
      expect(button.props.to).toBe('/document/id');
    });
  });

  describe('when doc is not active', () => {
    it('should not be active', () => {
      render();
      expect(component.find(Item).props().active).toBe(false);
    });

    describe('onClick', () => {
      it('should selectDocument', () => {
        render();
        component.find(Item).simulate('click');
        expect(props.selectDocument).toHaveBeenCalledWith(props.doc);
      });
    });
  });

  describe('when doc is active', () => {
    it('should be active true', () => {
      props.active = true;
      render();
      expect(component.find(Item).props().active).toBe(true);
    });

    describe('onClick', () => {
      it('should unselectDocument', () => {
        props.active = true;
        render();
        component.find(Item).simulate('click');
        expect(props.unselectDocument).toHaveBeenCalled();
      });
    });
  });

  describe('maped state', () => {
    let store;

    beforeEach(() => {
      store = {
        library: {
          ui: Immutable({selectedDocument: {_id: 'docId'}})
        }
      };
    });

    it('should set active as true if ownProps match selected ID', () => {
      const state = mapStateToProps(store, {doc: {_id: 'docId'}});
      expect(state.active).toBe(true);
    });

    it('should set active as false if ownProps holds unselected document', () => {
      const state = mapStateToProps(store, {doc: {_id: 'anotherId'}});
      expect(state.active).toBe(false);
    });
  });
});
