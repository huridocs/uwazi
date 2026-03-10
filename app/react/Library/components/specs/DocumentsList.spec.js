import React from 'react';
import { shallow } from 'enzyme';
import Immutable, { fromJS } from 'immutable';

import { clickOnDocument, selectAllDocuments, mapStateToProps } from '../DocumentsList';
import { DocumentsList } from '../../../Layout/DocumentsList';

describe('Library DocumentsList container', () => {
  let component;
  let instance;
  let props;
  const documents = Immutable.fromJS({
    rows: [
      { title: 'Document one', _id: '1' },
      { title: 'Document two', _id: '2' },
      { title: 'Document three', _id: '3' },
    ],
    totalRows: 3,
  });

  beforeEach(() => {
    props = {
      documents,
      selectedDocuments: Immutable.fromJS([]),
      search: { sort: 'sort' },
      filters: Immutable.fromJS({ documentTypes: [] }),
      searchDocuments: () => {},
      user: Immutable.fromJS({}),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      selectDocument: jasmine.createSpy('selectDocument'),
      selectDocuments: jasmine.createSpy('selectDocuments'),
      unselectDocument: jasmine.createSpy('unselectDocument'),
      storeKey: 'library',
      location: {},
      navigate: () => {},
    };
  });

  const render = () => {
    component = shallow(<DocumentsList {...props} />);
    instance = component.instance();
  };

  describe('clickOnDocument()', () => {
    it('should select the document', () => {
      render();
      const e = {};
      const doc = Immutable.fromJS({ _id: '1' });
      const active = false;
      clickOnDocument.call(instance, e, doc, active);
      expect(props.unselectAllDocuments).toHaveBeenCalled();
      expect(props.selectDocument).toHaveBeenCalledWith(doc);
    });

    describe('when holding cmd or ctrl', () => {
      it('should add the document to the selected documents', () => {
        render();
        const e = { metaKey: true };
        const doc = Immutable.fromJS({ _id: '1' });
        const active = false;
        clickOnDocument.call(instance, e, doc, active);
        expect(props.unselectAllDocuments).not.toHaveBeenCalled();
        expect(props.selectDocument).toHaveBeenCalledWith(doc);
      });
    });

    describe('when holding shift', () => {
      it('should select all the documents from the last selected document to the one clicked', () => {
        props.selectedDocuments = Immutable.fromJS([{ _id: '1' }]);
        render();
        const e = { shiftKey: true };
        const doc = Immutable.fromJS({ _id: '3' });
        const active = false;
        clickOnDocument.call(instance, e, doc, active);
        expect(props.unselectAllDocuments).not.toHaveBeenCalled();
        expect(props.selectDocuments).toHaveBeenCalledWith(documents.toJS().rows);
      });
    });

    describe('when multipleSelection is true', () => {
      it('should keep the previous selection and select the new one', () => {
        props.selectedDocuments = Immutable.fromJS([{ _id: '1' }]);
        render();
        const e = {};
        const doc = Immutable.fromJS({ _id: '3' });
        const active = false;
        const multipleSelection = true;
        clickOnDocument.call(instance, e, doc, active, multipleSelection);
        expect(props.unselectAllDocuments).not.toHaveBeenCalled();
        expect(props.selectDocument).toHaveBeenCalledWith(doc);
      });

      it('should keep the previous selection and unselect the active one ', () => {
        props.selectedDocuments = Immutable.fromJS([{ _id: '1' }]);
        render();
        const e = {};
        const doc = Immutable.fromJS({ _id: '3' });
        const active = true;
        const multipleSelection = true;
        clickOnDocument.call(instance, e, doc, active, multipleSelection);
        expect(props.unselectAllDocuments).not.toHaveBeenCalled();
        expect(props.selectDocument).not.toHaveBeenCalled();
        expect(props.unselectDocument).toHaveBeenCalledWith('3');
      });
    });
  });

  describe('maped state', () => {
    it('should contain the documents, library filters and search options', () => {
      const filters = fromJS({ documentTypes: [] });

      const store = {
        library: {
          documents,
          filters,
          ui: fromJS({ filtersPanel: 'panel', selectedDocuments: ['selected'], zoomLevel: 2 }),
          search: { sort: 'sortProperty' },
        },
        user: fromJS({ _id: 'uid' }),
      };

      const state = mapStateToProps(store, { storeKey: 'library' });
      expect(state).toEqual({
        documents,
        filters,
        filtersPanel: 'panel',
        search: { sort: 'sortProperty' },
        selectedDocuments: store.library.ui.get('selectedDocuments'),
        multipleSelected: false,
        rowListZoomLevel: 2,
        clickOnDocument,
        selectAllDocuments,
      });
    });
  });
});
