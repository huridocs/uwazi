import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableViewer } from 'app/Layout/TableViewer';
import { TableRow } from 'app/Library/components/TableRow';

describe('TableViewer', () => {
  let component: any;
  const commonProperties = [{ label: 'Titulo' }, { label: 'Created at' }];
  function render() {
    const storeState = {
      user: Immutable.fromJS({ _id: 'batId' }),
      library: {
        ui: Immutable.fromJS({
          tableViewColumns: Immutable.fromJS([
            { properties: [{ label: 'Date' }, { label: 'Country' }] },
          ]),
        }),
      },
      templates: Immutable.fromJS([
        {
          _id: 'idTemplate1',
          name: 'Template1',
          properties: [{ label: 'Date' }, { label: 'Country' }],
          commonProperties,
        },
        {
          _id: 'idTemplate2',
          name: 'Template2',
          properties: [{ label: 'Date' }, { label: 'Country' }],
          commonProperties,
        },
        {
          _id: 'idTemplate3',
          name: 'Template3',
          properties: [{ label: 'Country' }, { label: 'Date' }],
          commonProperties,
        },
        {
          _id: 'idTemplate4',
          name: 'Template4',
          commonProperties,
        },
      ]),
    };
    const documents = Immutable.fromJS({
      rows: [{ title: 'document1' }, { title: 'document2' }, { title: 'document3' }],
      aggregations: {
        all: {
          _types: {
            buckets: [
              { key: 'idTemplate1', doc_count: 54, filtered: { doc_count: 2 } },
              { key: 'idTemplate2', doc_count: 4, filtered: { doc_count: 0 } },
              { key: 'idTemplate3', doc_count: 4, filtered: { doc_count: 3 } },
              { key: 'idTemplate4', doc_count: 4, filtered: { doc_count: 1 } },
            ],
          },
        },
      },
    });
    const props = {
      documents,
      storeKey: 'library',
    };

    component = renderConnected(TableViewer, props, storeState);
  }
  describe('table header', () => {
    render();
    it('should display a row of headers with the properties of all entities', () => {
      const row = component.find('thead > tr').at(0);
      const header = row.find('th');
      expect(header.at(0).props().children).toBe(commonProperties[0].label);
      expect(header.at(1).props().children).toBe(commonProperties[1].label);
      expect(header.at(2).props().children).toBe('Template');
      expect(header.at(3).props().children).toBe('Date');
    });
    it('should not have duplicated properties', () => {
      const row = component.find('thead > tr').at(0);
      const cellDate = row.find({ children: 'Date' });
      const cellCountry = row.find({ children: 'Country' });
      expect(cellDate.length).toBe(1);
      expect(cellCountry.length).toBe(1);
    });
  });

  describe('table body', () => {
    render();
    it('should display a table row for each document listed', () => {
      const row = component.find(TableRow);
      expect(row.length).toBe(3);
    });
  });
});
