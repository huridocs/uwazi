import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableViewer } from 'app/Layout/TableViewer';

describe('TableViewer', () => {
  const formattedCreationDate = 'Jul 23, 2020';
  const formattedPropertyDate = 'May 20, 2019';
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
    const timestampCreation = Date.parse(formattedCreationDate).valueOf();
    const timestampProperty = Math.floor(Date.parse(formattedPropertyDate).valueOf() / 1000);
    const storeState = {
      thesauris: Immutable.fromJS([
        { _id: 'idThesauri1', name: 'thesauri1', values: [{ _id: 'v1', id: 'v1', label: 'V1' }] },
      ]),
      templates: Immutable.fromJS([
        {
          _id: 'idTemplate1',
          name: 'Template1',
          properties: [
            { label: 'Date', type: 'date', filter: true, name: 'date' },
            {
              label: 'Country',
              type: 'select',
              showInCard: false,
              name: 'country',
              content: 'idThesauri1',
            },
          ],
          commonProperties,
        },
        {
          _id: 'idTemplate2',
          name: 'Template2',
          properties: [
            { label: 'Date', type: 'date', filter: true, name: 'date' },
            { label: 'Country', type: 'select', showInCard: false },
          ],
          commonProperties,
        },
        {
          _id: 'idTemplate3',
          name: 'Template3',
          properties: [
            {
              label: 'Country',
              type: 'select',
              showInCard: true,
              name: 'country',
              content: 'idThesauri1',
            },
            { label: 'Date', type: 'date', filter: true, name: 'date' },
          ],
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
      rows: [
        {
          title: 'document1',
          creationDate: timestampCreation,
          template: 'idTemplate1',
          metadata: {
            date: [
              {
                value: timestampProperty,
              },
            ],
            country: [{ value: 'v1', label: 'V1' }],
          },
        },
        {
          title: 'document2',
          creationDate: timestampCreation,
          template: 'idTemplate3',
          metadata: {
            date: [
              {
                value: timestampProperty,
              },
            ],
          },
        },
        {
          title: 'document3',
          creationDate: timestampCreation,
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
    it('should display a row for each document listed', () => {
      const row = component.find('tbody > tr');
      expect(row.length).toBe(3);
    });
    it('should display the name of the template', () => {
      const row = component.find('tbody > tr').at(0);
      const cellDate = row.find('td').at(2);
      expect(cellDate.props().children[1]).toBe('Template1');
    });
    it('should display the creation date with ll format', () => {
      const row = component.find('tbody > tr').at(0);
      const cellDate = row.find('td').at(1);
      expect(cellDate.props().children[1]).toBe(formattedCreationDate);
    });
    it('should display a date property with ll format', () => {
      const row = component.find('tbody > tr').at(0);
      const cellDate = row.find('td').at(3);
      expect(cellDate.props().children[1]).toBe(formattedPropertyDate);
    });
    it('should display a select property with the label of the thesaurus', () => {
      const row = component.find('tbody > tr').at(0);
      const cellDate = row.find('td').at(4);
      expect(cellDate.props().children[1]).toBe('V1');
    });
  });
});
