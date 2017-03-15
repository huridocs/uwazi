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
      user: Immutable({_id: 'batId'}),
      active: false,
      selectDocument: jasmine.createSpy('selectDocument'),
      unselectDocument: jasmine.createSpy('unselectDocument'),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      searchParams: {sort: 'sortProperty'}
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

    it('should pass the searchParams to the item', () => {
      render();
      expect(component.find(Item).props().searchParams.sort).toBe('sortProperty');
    });
  });

  describe('when doc is not active', () => {
    it('should not be active', () => {
      render();
      expect(component.find(Item).props().active).toBe(false);
    });
  });

  describe('when doc is active', () => {
    it('should be active true', () => {
      props.active = true;
      render();
      expect(component.find(Item).props().active).toBe(true);
    });
  });

  describe('onClick', () => {
    it('should call onClick', () => {
      props.onClick = jasmine.createSpy('onClick');
      render();
      component.find(Item).simulate('click', {metaKey: false});
      expect(props.onClick).toHaveBeenCalled();
    });
  });

  describe('maped state', () => {
    let store;

    beforeEach(() => {
      store = {
        library: {
          ui: Immutable({selectedDocuments: [{_id: 'docId'}]})
        },
        user: Immutable({_id: 'batId'})
      };
    });

    it('should set active as true if ownProps match selected ID', () => {
      const state = mapStateToProps(store, {doc: Immutable({_id: 'docId'})});
      expect(state.active).toBe(true);
    });

    it('should set active as false if ownProps holds unselected document', () => {
      const state = mapStateToProps(store, {doc: Immutable({_id: 'anotherId'})});
      expect(state.active).toBe(false);
    });
  });
});
