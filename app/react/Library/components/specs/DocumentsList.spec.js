import React from 'react';
import {shallow} from 'enzyme';
import Immutable, {fromJS} from 'immutable';

import {clickOnDocument, mapStateToProps} from '../DocumentsList';
import DocumentsList from 'app/Layout/DocumentsList';

describe('Library DocumentsList container', () => {
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
      documents: documents,
      selectedDocuments: Immutable.fromJS([]),
      search: {sort: 'sort'},
      filters: Immutable.fromJS({documentTypes: []}),
      searchDocuments: () => {},
      user: Immutable.fromJS({}),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      selectDocument: jasmine.createSpy('selectDocument'),
      selectDocuments: jasmine.createSpy('selectDocuments'),
      unselectDocument: jasmine.createSpy('unselectDocument'),
      authorized: true,
      storeKey: 'library'
    };
  });

  let render = () => {
    component = shallow(<DocumentsList {...props} />);
    instance = component.instance();
  };

  describe('clickOnDocument()', () => {
    it('should select the document', () => {
      render();
      const e = {};
      const doc = Immutable.fromJS({_id: '1'});
      const active = false;
      clickOnDocument.call(instance, e, doc, active);
      expect(props.unselectAllDocuments).toHaveBeenCalled();
      expect(props.selectDocument).toHaveBeenCalledWith(doc);
    });

    describe('when holding cmd or ctrl', () => {
      it('should add the document to the selected documents', () => {
        render();
        const e = {metaKey: true};
        const doc = Immutable.fromJS({_id: '1'});
        const active = false;
        clickOnDocument.call(instance, e, doc, active);
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
        clickOnDocument.call(instance, e, doc, active);
        expect(props.unselectAllDocuments).not.toHaveBeenCalled();
        expect(props.selectDocuments).toHaveBeenCalledWith(documents.toJS().rows);
      });
    });
  });

  describe('maped state', () => {
    it('should contain the documents, library filters and search options', () => {
      const filters = fromJS({documentTypes: []});

      let store = {
        library: {
          documents,
          filters,
          ui: fromJS({filtersPanel: 'panel', selectedDocuments: ['selected']})
        },
        search: {sort: 'sortProperty'},
        user: fromJS({_id: 'uid'})
      };

      let state = mapStateToProps(store, {storeKey: 'library'});
      expect(state).toEqual({
        documents: documents,
        filters,
        filtersPanel: 'panel',
        search: {sort: 'sortProperty'},
        selectedDocuments: store.library.ui.get('selectedDocuments'),
        multipleSelected: false,
        authorized: true,
        clickOnDocument
      });
    });
  });
});
