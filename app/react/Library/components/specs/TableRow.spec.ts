import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableRow } from 'app/Library/components/TableRow';

describe('TableRow', () => {
  const formattedCreationDate = 'Jul 23, 2020';
  const formattedPropertyDate = 'May 20, 2019';
  let component: any;
  const columns = Immutable.fromJS([
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
    {
      label: 'Template',
      type: 'text',
      name: 'templateName',
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
  ]);
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
            {
              label: 'Languages',
              type: 'multiselect',
              showInCard: false,
              name: 'languages',
              content: 'idThesauri2',
            },
          ],
        },
        {
          _id: 'idTemplate2',
          name: 'Template2',
          properties: [{ label: 'Date', type: 'date', filter: true, name: 'date' }],
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
    it('should render a column with the name of document', () => {
      const cellDate = component.find('td').at(0);
      expect(cellDate.props().children[1]).toBe('document1');
    });
    it('should render a column with the creation date with ll format', () => {
      const cellDate = component.find('td').at(1);
      expect(cellDate.props().children[1]).toBe(formattedCreationDate);
    });

    it('should render a column with the name of the template', () => {
      const cellDate = component.find('td').at(2);
      expect(cellDate.props().children[1]).toBe('Template1');
    });
    it('should render a column with a date property with ll format', () => {
      const cellDate = component.find('td').at(3);
      expect(cellDate.props().children[1]).toBe(formattedPropertyDate);
    });
    it('should render a column with the label of the thesaurus', () => {
      const cellDate = component.find('td').at(4);
      expect(cellDate.props().children[1]).toBe('Colombia');
    });
    it('should render a column with the values as list of labels', () => {
      const cellDate = component.find('td').at(5);
      expect(cellDate.props().children[1]).toBe('English, Español');
    });
  });
});
