import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableRow } from 'app/Library/components/TableRow';

describe('TableRow', () => {
  const formattedCreationDate = 'Jul 23, 2020';
  const formattedPropertyDate = 'May 20, 2019';
  let component: any;
  const columns = [
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
    { label: 'Date', type: 'date', filter: true, name: 'date' },
    {
      label: 'Country',
      type: 'select',
      showInCard: false,
      name: 'country',
      content: 'idThesauri1',
    },
    {
      label: 'Languages',
      type: 'multiselect',
      showInCard: true,
      name: 'languages',
      content: 'idThesauri2',
    },
  ];
  function render() {
    const timestampCreation = Date.parse(formattedCreationDate).valueOf();
    const timestampProperty = Math.floor(Date.parse(formattedPropertyDate).valueOf() / 1000);
    const storeState = {
      user: Immutable.fromJS({ _id: 'batId' }),
      library: { ui: {} },
      thesauris: Immutable.fromJS([
        {
          _id: 'idThesauri1',
          name: 'countries',
          values: [
            { _id: 'cv1', id: 'cv1', label: 'Colombia' },
            { _id: 'cv2', id: 'cv2', label: 'Peru' },
          ],
        },
        {
          _id: 'idThesauri2',
          name: 'languages',
          values: [
            { _id: 'lv1', id: 'lv1', label: 'Español' },
            { _id: 'lv2', id: 'lv2', label: 'English' },
          ],
        },
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
        },
        {
          _id: 'idTemplate2',
          name: 'Template2',
          properties: [
            { label: 'Date', type: 'date', filter: true, name: 'date' },
            { label: 'Country', type: 'select', showInCard: false },
          ],
        },
        {
          _id: 'idTemplate3',
          name: 'Template3',
          properties: [
            {
              label: 'Languages',
              type: 'multiselect',
              showInCard: true,
              name: 'languages',
              content: 'idThesauri2',
            },
            { label: 'Date', type: 'date', filter: true, name: 'date' },
          ],
        },
        {
          _id: 'idTemplate4',
          name: 'Template4',
        },
      ]),
    };
    const document = Immutable.fromJS({
      title: 'document1',
      creationDate: timestampCreation,
      template: 'idTemplate1',
      metadata: {
        date: [
          {
            value: timestampProperty,
          },
        ],
        country: [{ value: 'cv1', label: 'Colombia' }],
        languages: [
          { value: 'lv1', label: 'Español' },
          { value: 'lv2', label: 'English' },
        ],
      },
    });
    const props = {
      document,
      columns,
    };

    component = renderConnected(TableRow, props, storeState);
  }
  describe('table header', () => {
    render();
    it('should pass a document to tableRow with the name of the template', () => {
      const row = component.find(TableRow).at(0);
      expect(row.props().document.templateName).toBe('Template1');
    });
    it('should pass a document to tableRow with the creation date with ll format', () => {
      const row = component.find(TableRow).at(0);
      expect(row.props().document.metadata.creationDate.value).toBe(formattedCreationDate);
    });
    it('should pass a document to tableRow with the date property with ll format', () => {
      const row = component.find(TableRow).at(0);
      expect(row.props().document.metadata.date.value).toBe(formattedPropertyDate);
    });
    it('should pass a document to tableRow with the select property with the label of the thesaurus', () => {
      const row = component.find(TableRow).at(0);
      expect(row.props().document.metadata.country.value).toBe('V1');
    });
    it('should pass a document to tableRow with the multiselect property with the values as list of labels', () => {
      const row = component.find(TableRow).at(1);
      expect(row.props().document.metadata.country.value).toBe('V1, V2');
    });
  });
});
