import Immutable from 'immutable';

import { renderConnected } from 'app/utils/test/renderConnected';
import { TableRows } from 'app/Layout/TableRows';
import { TableRow } from 'app/Library/components/TableRow';

describe('TableRows', () => {
  let component: any;
  const rows = [
    { _id: 'entity1ID', title: 'entity1' },
    { _id: 'entity2ID', title: 'entity2' },
    { _id: 'entity3ID', title: 'entity3' },
  ];

  const columnList = [
    { name: 'date', label: 'Date', hidden: false },
    { name: 'country', label: 'Country', hidden: false },
  ];
  const columns = columnList;
  const onEndScroll = jasmine.createSpy('onEndScroll');
  const props = {
    columns,
    storeKey: 'library',
    clickOnDocument: jasmine.createSpy('clickOnDocumentApply'),
    onEndScroll,
  };
  const documents = Immutable.fromJS({
    rows,
  });
  const storeState = {
    library: {
      documents,
      ui: Immutable.fromJS({ selectedDocuments: [{ _id: 'entity1' }, { _id: 'entity2' }] }),
    },
  };

  function render() {
    component = renderConnected(TableRows, props, storeState);
  }

  describe('tablerows', () => {
    it('should display a table row for each document listed', () => {
      render();
      const row = component.find(TableRow);
      expect(row.length).toBe(3);
    });
    it('should pass to each row the columns and the document', () => {
      render();
      const row = component.find(TableRow);
      expect(row.at(0).props()).toEqual({
        entity: documents.get('rows').get(0),
        columns: columnList,
        storeKey: props.storeKey,
        clickOnDocument: props.clickOnDocument,
        multipleSelection: true,
        setMultipleSelection: expect.any(Function),
      });
    });
  });
});
