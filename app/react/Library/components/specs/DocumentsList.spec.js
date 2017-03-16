import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {DocumentsList} from 'app/Library/components/DocumentsList';
import Doc from 'app/Library/components/Doc';
import SortButtons from 'app/Library/components/SortButtons';

describe('DocumentsList', () => {
  let component;
  let instance;
  let props;
  let documents = Immutable.fromJS({rows: [
    {title: 'Document one', _id: '1'},
    {title: 'Document two', _id: '2'},
    {title: 'Document three', _id: '3'}
  ], totalRows: 3});

  beforeEach(() => {
    props = {
      documents: documents.toJS(),
      selectedDocuments: Immutable.fromJS([]),
      search: {sort: 'sort'},
      filters: Immutable.fromJS({documentTypes: []}),
      searchDocuments: () => {},
      user: Immutable.fromJS({}),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      selectDocument: jasmine.createSpy('selectDocument'),
      selectDocuments: jasmine.createSpy('selectDocuments'),
      unselectDocument: jasmine.createSpy('unselectDocument'),
      authorized: true
    };
  });

  let render = () => {
    component = shallow(<DocumentsList {...props} />);
    instance = component.instance();
  };

  it('should have with-panel class', () => {
    render();
    expect(component.find('main').hasClass('with-panel')).toBe(true);
  });

  it('should render a Doc element for each document, passing the search options', () => {
    render();
    let docs = component.find(Doc);
    expect(docs.length).toBe(3);
    expect(docs.first().props().doc.get('title')).toBe('Document one');
    expect(docs.first().props().searchParams).toEqual({sort: 'sort'});
  });

  it('should hold sortButtons with search callback and selectedTemplates', () => {
    render();
    expect(component.find(SortButtons).props().sortCallback).toBe(props.searchDocuments);
    expect(component.find(SortButtons).props().selectedTemplates).toBe(props.filters.get('documentTypes'));
  });

  describe('clickOnDocument()', () => {
    it('should select the document', () => {
      render();
      const e = {};
      const doc = Immutable.fromJS({_id: '1'});
      const active = false;
      instance.clickOnDocument(e, doc, active);
      expect(props.unselectAllDocuments).toHaveBeenCalled();
      expect(props.selectDocument).toHaveBeenCalledWith(doc);
    });

    describe('when holding cmd or ctrl', () => {
      it('should add the document to the selected documents', () => {
        render();
        const e = {metaKey: true};
        const doc = Immutable.fromJS({_id: '1'});
        const active = false;
        instance.clickOnDocument(e, doc, active);
        expect(props.unselectAllDocuments).not.toHaveBeenCalled();
        expect(props.selectDocument).toHaveBeenCalledWith(doc);
      });
    });

    describe('when holding shift', () => {
      it('should select all the documents from the last selected document to the one clicked', () => {
        props.selectedDocuments = Immutable.fromJS([{_id: '1'}]);
        render();
        const e = {shiftKey: true};
        const doc = Immutable.fromJS({_id: '3'});
        const active = false;
        instance.clickOnDocument(e, doc, active);
        expect(props.unselectAllDocuments).not.toHaveBeenCalled();
        expect(props.selectDocuments).toHaveBeenCalledWith(documents.toJS().rows);
      });
    });
  });
});
