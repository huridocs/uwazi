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

    it('shoul hold a link to the document', () => {
      render();
      const button = component.find(Item).props().buttons;
      expect(button.props.to).toBe('/document/id');
    });
  });

  describe('when doc is not selected', () => {
    it('should not be active', () => {
      render();
      expect(component.find(Item).props().active).not.toBeDefined();
    });

    describe('onClick', () => {
      it('should selectDocument', () => {
        render();
        component.find(Item).simulate('click');
        expect(props.selectDocument).toHaveBeenCalledWith(props.doc);
      });
    });
  });

  describe('when doc is selected and its another document', () => {
    it('should be active false', () => {
      props.selectedDocument = 'another_document';
      render();
      expect(component.find(Item).props().active).toBe(false);
    });
    describe('onClick', () => {
      it('should selectDocument', () => {
        props.selectedDocument = 'another_document';
        render();
        component.find(Item).simulate('click');
        expect(props.selectDocument).toHaveBeenCalledWith(props.doc);
      });
    });
  });

  describe('when doc is selected and its the same document', () => {
    it('should be active true', () => {
      props.selectedDocument = 'idOne';
      render();
      expect(component.find(Item).props().active).toBe(true);
    });
    describe('onClick', () => {
      it('should unselectDocument', () => {
        props.selectedDocument = 'idOne';
        render();
        component.find(Item).simulate('click');
        expect(props.unselectDocument).toHaveBeenCalled();
      });
    });
  });

  describe('maped state', () => {
    it('should contain the previewDoc', () => {
      let store = {
        library: {
          ui: Immutable({selectedDocument: {_id: 'docId'}})
        }
      };
      let state = mapStateToProps(store);
      expect(state.selectedDocument).toEqual('docId');
    });
  });
});
