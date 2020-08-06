import Immutable from 'immutable';

import { I18NLink } from 'app/I18N';
import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableRow } from 'app/Library/components/TableRow';
import MarkdownViewer from 'app/Markdown';

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
      name: 'country',
      content: 'idThesauri1',
    },
    {
      label: 'Languages',
      type: 'multiselect',
      name: 'languages',
      content: 'idThesauri2',
    },
    {
      label: 'Rich text',
      type: 'markdown',
      name: 'rich_text',
    },
    {
      label: 'Relationship',
      type: 'relationship',
      name: 'relationship',
    },
    {
      label: 'Link',
      type: 'link',
      name: 'link',
    },
    {
      label: 'Geolocation',
      type: 'geolocation',
      name: 'geolocation_geolocation',
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
            {
              label: 'Rich text',
              type: 'markdown',
              name: 'rich_text',
            },
            {
              label: 'Relationship',
              type: 'relationship',
              name: 'relationship',
            },
            {
              label: 'Link',
              type: 'link',
              name: 'link',
            },
            {
              label: 'Geolocation',
              type: 'geolocation',
              name: 'geolocation_geolocation',
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
        rich_text: [{ value: '**bold**' }],
        relationship: [
          {
            icon: null,
            label: 'Entity1',
            type: 'entity',
            value: 'Entity1',
          },
        ],
        link: [
          {
            value: {
              label: 'google',
              url: 'www.google.com',
            },
          },
        ],
        geolocation_geolocation: [
          {
            value: {
              lon: 2,
              lat: 46,
            },
          },
        ],
      },
    });
    const props = {
      document,
      columns,
    };

    component = renderConnected(TableRow, props, storeState);
  }
  describe('columns format', () => {
    render();
    const renderedColumns = component.find('td');
    it('should render a column with the name of document', () => {
      expect(renderedColumns.at(0).props().children[1]).toBe('document1');
    });
    it('should render a column with the creation date with ll format', () => {
      expect(renderedColumns.at(1).props().children[1]).toBe(formattedCreationDate);
    });
    it('should render a column with the name of the template', () => {
      expect(renderedColumns.at(2).props().children[1]).toBe('Template1');
    });
    it('should render a column with a date property with ll format', () => {
      expect(renderedColumns.at(3).props().children[1]).toBe(formattedPropertyDate);
    });
    it('should render a column with the label of the thesaurus', () => {
      expect(renderedColumns.at(4).props().children[1]).toBe('Colombia');
    });
    it('should render a column with the values as list of labels', () => {
      expect(renderedColumns.at(5).props().children[1]).toBe('English, Español');
    });
    it('should render a column with rich text for markdown property', () => {
      expect(
        renderedColumns
          .at(6)
          .find(MarkdownViewer)
          .props().markdown
      ).toBe('**bold**');
    });
    it('should render a column with links to related entities', () => {
      const links = renderedColumns.at(7).find(I18NLink);
      expect(links.props().to).toBe('/entity/Entity1');
    });
    it('should render a column with a link', () => {
      expect(
        renderedColumns
          .at(8)
          .find(I18NLink)
          .props().to
      ).toBe('www.google.com');
    });
    it('should render a geolocation column', () => {
      const geolocationProps = renderedColumns.at(9).props().children[1].props;
      expect(geolocationProps.points).toEqual([{ lon: 2, lat: 46 }]);
      expect(geolocationProps.onlyForCards).toBe(true);
    });
  });
});
