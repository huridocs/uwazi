import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {mapStateToProps} from '../Doc';
import {Doc} from '../Doc';
import {RowList} from 'app/Layout/Lists';

import PrintDate from 'app/Layout/PrintDate';

describe('Doc', () => {
  let component;
  let props = {};

  beforeEach(() => {
    props = {
      doc: {_id: 'idOne', template: 'templateId', creationDate: 1234},
      templates: Immutable.fromJS([{_id: 'templateId', properties: []}]),
      thesauris: Immutable.fromJS([]),
      selectDocument: jasmine.createSpy('selectDocument'),
      unselectDocument: jasmine.createSpy('unselectDocument')
    };
  });

  let render = () => {
    component = shallow(<Doc {...props}/>);
  };

  describe('metadata', () => {
    it('should expose the creation date as basic metadata', () => {
      render();
      const metadata = component.find(PrintDate).parent().parent();
      expect(metadata.find('dt').text()).toBe('Upload date');
      expect(metadata.find(PrintDate).props().utc).toBe(1234);
      expect(metadata.find(PrintDate).props().toLocal).toBe(true);
    });

    describe('when template has showInCard properties', () => {
      beforeEach(() => {
        props.doc.metadata = {
          p1: 'yes',
          p2: 'no',
          p3: 237600000
        };

        props.templates = Immutable.fromJS([{
          _id: 'templateId',
          properties: [
            {name: 'p1', type: 'text', label: 'should appear 1', showInCard: true},
            {name: 'p2', type: 'text', label: 'should not appear', showInCard: false},
            {name: 'p3', type: 'date', label: 'should appear 2', showInCard: true}
          ]
        }]);

        props.thesauris = Immutable.fromJS([{_id: 'dummyThesauri'}]);
      });

      it('should expose multiple formated properties', () => {
        render();
        const metadata = component.find('.item-metadata');
        expect(metadata.children().length).toBe(2);
        expect(metadata.children().first().html()).toContain('should appear 1');
        expect(metadata.children().first().html()).toContain('yes');
        expect(metadata.children().last().html()).toContain('should appear 2');
        expect(metadata.children().last().html()).toContain('13');
        expect(metadata.children().last().html()).toContain('1977');
      });
    });
  });

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
