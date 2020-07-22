import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableViewer } from 'app/Layout/TableViewer';

describe('TableViewer', () => {
  let component: any;
  const commonProperties = [
    {
      label: 'Titulo',
      type: 'text',
      name: 'title',
    },
    {
      label: 'Created at',
      type: 'date',
      name: 'creationDate',
    },
  ];
  function render() {
    const storeState = {
      templates: Immutable.fromJS([
        {
          _id: 'idTemplate1',
          properties: [
            { label: 'Date', type: 'date', filter: true },
            { label: 'Country', type: 'select', showInCard: false },
          ],
          commonProperties,
        },
        {
          _id: 'idTemplate2',
          properties: [
            { label: 'Date', type: 'date', filter: true },
            { label: 'Country', type: 'select', showInCard: false },
          ],
          commonProperties,
        },
        {
          _id: 'idTemplate3',
          properties: [
            { label: 'Country', type: 'select', showInCard: true },
            { label: 'Date', type: 'date', filter: true },
          ],
          commonProperties,
        },
        {
          _id: 'idTemplate4',
          commonProperties,
        },
      ]),
    };
    const documents = Immutable.fromJS({
      rows: [
        {
          title: 'document1',
          creationDate: 1595359919055,
          template: 'idTemplate1',
          metadata: {
            Date: [
              {
                value: 1595359919055,
              },
            ],
          },
        },
        {
          title: 'document2',
          creationDate: 1595359919055,
          template: 'idTemplate3',
          metadata: {
            Date: [
              {
                value: 1595359919055,
              },
            ],
          },
        },
        {
          title: 'document3',
          creationDate: 1595359919055,
          template: 'idTemplate4',
        },
      ],
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
    };

    component = renderConnected(TableViewer, props, storeState);
  }
  it('should display a row of headers with the properties of all entities', () => {
    render();
    const row = component.find('thead > tr').at(0);
    const header = row.find('th');
    expect(header.at(0).props().children).toBe(commonProperties[0].label);
    expect(header.at(1).props().children).toBe(commonProperties[1].label);
    //expect(header.at(2).props().children).toBe('Template');
    expect(header.at(2).props().children).toBe('Date');
  });

  it('should not have duplicated properties', () => {
    render();
    const row = component.find('thead > tr').at(0);
    const cellDate = row.find({ children: 'Date' });
    const cellCountry = row.find({ children: 'Country' });
    expect(cellDate.length).toBe(1);
    expect(cellCountry.length).toBe(1);
  });
});
