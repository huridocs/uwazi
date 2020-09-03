import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableViewer } from 'app/Layout/TableViewer';
import { Translate } from 'app/I18N';

describe('TableViewer', () => {
  let component: any;
  const columnList = [
    { name: 'date', label: 'Date', hidden: false },
    { name: 'city', label: 'City', hidden: true },
    { name: 'country', label: 'Country', hidden: false },
  ];
  const columns = Immutable.fromJS(columnList);
  const onEndScroll = jasmine.createSpy('onEndScroll');
  const props = {
    storeKey: 'library',
    onEndScroll,
  };
  const storeState = {
    library: {
      ui: Immutable.fromJS({
        tableViewColumns: columns,
      }),
    },
  };

  function render() {
    component = renderConnected(TableViewer, props, storeState);
  }

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

  describe('infinite scroll', () => {
    render();

    it('should call onEndScroll if scrolling reach the end of content', () => {
      const tableWrapper = component.find('.tableview-wrapper').at(0);
      tableWrapper
        .props()
        .onScroll({ target: { scrollHeight: 1204, scrollTop: 406, clientHeight: 798 } });
      expect(onEndScroll).toHaveBeenCalled();
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
