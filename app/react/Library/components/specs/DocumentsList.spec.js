import Immutable from 'immutable';

import {mapStateToProps} from 'app/Library/components/DocumentsList';

describe('DocumentsList', () => {
  let documents = Immutable.fromJS({rows: [{title: 'Document one', _id: '1'}, {title: 'Document two', _id: '2'}], totalRows: 2});

  describe('maped state', () => {
    it('should contain the documents, library filters and search options', () => {
      const filters = Immutable.fromJS({documentTypes: []});

      let store = {
        library: {
          documents,
          filters,

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
