import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableViewer } from 'app/Layout/TableViewer';
import { TableRow } from 'app/Library/components/TableRow';

describe('TableViewer', () => {
  let component: any;
  const documents = Immutable.fromJS({
    rows: [
      { _id: 'entity1ID', title: 'entity1' },
      { _id: 'entity2ID', title: 'entity2' },
      { _id: 'entity3ID', title: 'entity3' },
    ],
  });
  const columns = Immutable.fromJS([
    { name: 'date', label: 'Date', hidden: false },
    { name: 'city', label: 'City', hidden: true },
    { name: 'country', label: 'Country', hidden: false },
  ]);
  const props = {
    documents,
    storeKey: 'library',
    clickOnDocument: jasmine.createSpy('clickOnDocumentApply'),
    rowListZoomLevel: 2,
  };
  const templates = Immutable.fromJS([{ _id: 'idTemplate1' }]);
  const thesauris = Immutable.fromJS([{ _id: 'thesaurus1' }]);
  function render() {
    const storeState = {
      library: {
        ui: Immutable.fromJS({
          tableViewColumns: columns,
        }),
      },
      templates,
      thesauris,
    };

    component = renderConnected(TableViewer, props, storeState);
  }
  describe('table header', () => {
    render();
    it('should display only not hidden columns', () => {
      const row = component.find('thead > tr').at(0);
      const header = row.find('th div');
      expect(header.length).toBe(2);
      expect(header.at(0).props().children).toBe('Date');
      expect(header.at(1).props().children).toBe('Country');
    });
  });

  describe('table body', () => {
    render();
    it('should display a table row for each document listed', () => {
      const row = component.find(TableRow);
      expect(row.length).toBe(3);
    });
    it('should pass to each row the columns and the document', () => {
      const row = component.find(TableRow);
      const columnsToShow = Immutable.fromJS([
        { name: 'date', label: 'Date', hidden: false },
        { name: 'country', label: 'Country', hidden: false },
      ]);
      expect(row.at(0).props()).toEqual({
        entity: documents.get('rows').get(0),
        columns: columnsToShow,
        storeKey: props.storeKey,
        clickOnDocument: props.clickOnDocument,
        zoomLevel: 2,
      });
    });
  });
});
