import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {mapStateToProps} from '../Doc';
import {Doc} from '../Doc';
import {Item} from 'app/Layout';

import {NeedAuthorization} from 'app/Auth';

describe('Doc', () => {
  let component;
  let props = {};

  beforeEach(() => {
    const doc = {
      _id: 'idOne',
      template: 'templateId',
      creationDate: 1234,
      type: 'document',
      sharedId: 'id',
      processed: true,
      connections: [{sourceType: 'metadata'}, {_id: 'c1', sourceType: 'other', nonRelevant: true}]
    };

    props = {
      doc: Immutable(doc),
      user: Immutable({_id: 'batId'}),
      active: false,
      selectDocument: jasmine.createSpy('selectDocument'),
      deleteConnection: jasmine.createSpy('deleteConnection'),
      unselectDocument: jasmine.createSpy('unselectDocument'),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      searchParams: {sort: 'sortProperty'},
      storeKey: 'library',
      additionalText: 'passedAdditionalText'
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

    describe('Connections header', () => {
      let header;

      beforeEach(() => {
        render();
        header = shallow(component.find(Item).props().itemHeader);
      });

      it('should pass the connections and include delete button for only non-metadata properties', () => {
        expect(header.find('.item-connection').length).toBe(2);
        expect(header.find('button').at(0).parents().at(1).is(NeedAuthorization)).toBe(true);
        expect(header.find('button').at(0).parent().props().if).toBe(false);
        expect(header.find('button').at(1).parent().props().if).toBe(true);
      });

      it('should alow deleting non-metadata connections', () => {
        const eMock = {stopPropagation: jasmine.createSpy('stopPropagation')};
        expect(props.deleteConnection).not.toHaveBeenCalled();

        header.find('button').at(1).simulate('click', eMock);

        expect(eMock.stopPropagation).toHaveBeenCalled();
        expect(props.deleteConnection).toHaveBeenCalledWith({_id: 'c1', sourceType: 'other'});
      });
    });

    it('should pass the className to the item', () => {
      render();
      expect(component.find(Item).props().className).toBeUndefined();
      props.className = 'passed-classname';
      render();
      expect(component.find(Item).props().className).toContain('passed-classname');
    });

    it('should pass the searchParams to the item', () => {
      render();
      expect(component.find(Item).props().searchParams.sort).toBe('sortProperty');
    });

    it('should pass the additionalText to the item', () => {
      render();
      expect(component.find(Item).props().additionalText).toBe('passedAdditionalText');
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
        uploads: {
          progress: Immutable({})
        },
        user: Immutable({_id: 'batId'})
      };
    });

    it('should set active as true if ownProps match selected ID', () => {
      const state = mapStateToProps(store, {doc: Immutable({_id: 'docId'}), storeKey: 'library'});
      expect(state.active).toBe(true);
    });

    it('should set active as false if ownProps holds unselected document', () => {
      const state = mapStateToProps(store, {doc: Immutable({_id: 'anotherId'}), storeKey: 'library'});
      expect(state.active).toBe(false);
    });
  });
});
