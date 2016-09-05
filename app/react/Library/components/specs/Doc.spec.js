import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {mapStateToProps} from '../Doc';
import {Doc} from '../Doc';
import {RowList} from 'app/Layout/Lists';

describe('Doc', () => {
  let component;
  let props = {};

  beforeEach(() => {
    props = {
      doc: {_id: 'idOne', template: 'templateId'},
      templates: Immutable.fromJS([{_id: 'templateId', properties: []}]),
      thesauris: Immutable.fromJS([]),
      selectDocument: jasmine.createSpy('selectDocument'),
      unselectDocument: jasmine.createSpy('unselectDocument')
    };
  });

  let render = () => {
    component = shallow(<Doc {...props}/>);
  };

  describe('when doc is not selected', () => {
    it('should not be active', () => {
      render();
      expect(component.find(RowList.Item).props().active).not.toBeDefined();
    });

    describe('onClick', () => {
      it('should selectDocument', () => {
        render();
        component.find(RowList.Item).simulate('click');
        expect(props.selectDocument).toHaveBeenCalledWith(props.doc);
      });
    });
  });

  describe('when doc is selected and its another document', () => {
    it('should be active false', () => {
      props.selectedDocument = 'another_document';
      render();
      expect(component.find(RowList.Item).props().active).toBe(false);
    });
    describe('onClick', () => {
      it('should selectDocument', () => {
        props.selectedDocument = 'another_document';
        render();
        component.find(RowList.Item).simulate('click');
        expect(props.selectDocument).toHaveBeenCalledWith(props.doc);
      });
    });
  });

  describe('when doc is selected and its the same document', () => {
    it('should be active true', () => {
      props.selectedDocument = 'idOne';
      render();
      expect(component.find(RowList.Item).props().active).toBe(true);
    });
    describe('onClick', () => {
      it('should unselectDocument', () => {
        props.selectedDocument = 'idOne';
        render();
        component.find(RowList.Item).simulate('click');
        expect(props.unselectDocument).toHaveBeenCalled();
      });
    });
  });

  describe('maped state', () => {
    it('should contain the previewDoc', () => {
      let store = {
        library: {
          ui: Immutable.fromJS({selectedDocument: {_id: 'docId'}})
        },
        templates: Immutable.fromJS(['templates'])
      };
      let state = mapStateToProps(store);
      expect(state.selectedDocument).toEqual('docId');
      expect(state.templates.toJS()).toEqual(['templates']);
    });
  });
});
