import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableViewer } from 'app/Layout/TableViewer';
import { TableRow } from 'app/Library/components/TableRow';
import { Translate } from 'app/I18N';

describe('TableViewer', () => {
  let component: any;
  let instance: any;
  const rows = [
    { _id: 'entity1ID', title: 'entity1' },
    { _id: 'entity2ID', title: 'entity2' },
    { _id: 'entity3ID', title: 'entity3' },
  ];
  const documents = Immutable.fromJS({
    rows,
  });

  const columnList = [
    { name: 'date', label: 'Date', hidden: false },
    { name: 'city', label: 'City', hidden: true },
    { name: 'country', label: 'Country', hidden: false },
  ];
  const columns = Immutable.fromJS(columnList);
  const onEndScroll = jasmine.createSpy('onEndScroll');
  const props = {
    documents,
    storeKey: 'library',
    clickOnDocument: jasmine.createSpy('clickOnDocumentApply'),
    onEndScroll,
    rowListZoomLevel: 2,
  };
  const templates = Immutable.fromJS([{ _id: 'idTemplate1' }]);
  const thesauris = Immutable.fromJS([{ _id: 'thesaurus1' }]);
  const storeState = {
    library: {
      ui: Immutable.fromJS({
        tableViewColumns: columns,
      }),
    },
    templates,
    thesauris,
  };

  function render() {
    component = renderConnected(TableViewer, props, storeState);
    instance = component.instance();
  }

  describe('shouldComponentUpdate', () => {
    it('should update only if there are columns available', () => {
      storeState.library.ui.set('tableViewColumns', []);
      render();
      const nextPropsNewColumns = { ...props, columns: [columnList[0]] };
      expect(instance.shouldComponentUpdate(nextPropsNewColumns)).toBe(true);
      const nextPropsEmptyColumns = { ...props, columns: [] };
      expect(instance.shouldComponentUpdate(nextPropsEmptyColumns)).toBe(false);
    });

    it('should update if the number of rows has changed', () => {
      render();
      const allColumnsHidden = columnList.map(c => ({ ...c, hidden: false }));
      const nextProps = { ...props, columns: allColumnsHidden };
      expect(instance.shouldComponentUpdate(nextProps)).toBe(true);
    });

    it('should update if the number of hidden columns has changed', () => {
      render();
      const nextPropsNewColumns = { ...props, columns: columnList };
      expect(instance.shouldComponentUpdate(nextPropsNewColumns)).toBe(false);
      const newRows = [...rows, { _id: 'entity4ID', title: 'entity4' }];
      const nextProps = { ...nextPropsNewColumns, documents: Immutable.fromJS({ rows: newRows }) };
      expect(instance.shouldComponentUpdate(nextProps)).toBe(true);
    });
  });

  describe('table header', () => {
    render();
    it('should display only not hidden columns', () => {
      const row = component.find('thead > tr').at(0);
      const header = row.find('th div');
      expect(header.length).toBe(2);
      expect(
        header
          .at(0)
          .find(Translate)
          .props().children
      ).toBe('Date');
      expect(
        header
          .at(1)
          .find(Translate)
          .props().children
      ).toBe('Country');
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
      const columnsToShow = [
        { name: 'date', label: 'Date', hidden: false },
        { name: 'country', label: 'Country', hidden: false },
      ];
      expect(row.at(0).props()).toEqual({
        entity: documents.get('rows').get(0),
        columns: columnsToShow,
        storeKey: props.storeKey,
        clickOnDocument: props.clickOnDocument,
        zoomLevel: 2,
      });
    });
  });

  describe('infinite scroll', () => {
    render();

    it('should call onEndScroll if scrolling reach the end of content', () => {
      const tableWrapper = component.find('.tableview-wrapper').at(0);
      tableWrapper
        .props()
        .onScroll({ target: { scrollHeight: 1204, scrollTop: 406, clientHeight: 798 } });
      expect(onEndScroll).toHaveBeenCalledWith(30, rows.length);
    });

    it('should shoud not call onEndScroll if scrolling do not reach the end of content', () => {
      onEndScroll.calls.reset();
      const tableWrapper = component.find('.tableview-wrapper').at(0);
      tableWrapper
        .props()
        .onScroll({ target: { scrollHeight: 100, scrollTop: 50, clientHeight: 100 } });
      expect(onEndScroll).not.toBeCalled();
    });
  });
});
