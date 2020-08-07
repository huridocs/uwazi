/**
 * @jest-environment jsdom
 */
import Immutable from 'immutable';

import { I18NLink } from 'app/I18N';
import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableRow } from 'app/Library/components/TableRow';
import MarkdownViewer from 'app/Markdown';

describe('TableRow', () => {
  const formattedCreationDate = 'Jul 23, 2020';
  const formattedPropertyDate = 'May 20, 2019';
  let component: any;
  let instance: any;
  let document: any;
  const commonColumns = [
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
  ];
  const templateColumns = [
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
    {
      label: 'Text',
      type: 'text',
      name: 'text',
    },
    {
      label: 'Image',
      type: 'image',
      name: 'image',
    },
  ];
  const onClickSpy = jasmine.createSpy('onClick');

  function render() {
    const timestampCreation = Date.parse(formattedCreationDate).valueOf();
    const timestampProperty = Math.floor(Date.parse(formattedPropertyDate).valueOf() / 1000);
    const storeState = {
      user: Immutable.fromJS({ _id: 'batId' }),
      library: { ui: Immutable.fromJS({ selectedDocuments: [{ _id: 'selectedDocument1' }] }) },
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
          properties: templateColumns,
        },
        {
          _id: 'idTemplate2',
          name: 'Template2',
          properties: [{ label: 'Date', type: 'date', filter: true, name: 'date' }],
        },
      ]),
    };
    document = Immutable.fromJS({
      _id: 'selectedDocument1',
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
            label: 'Entity1',
            type: 'entity',
            value: 'Entity1',
          },
          {
            label: 'Entity2',
            type: 'entity',
            value: 'Entity2',
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
        text: [
          {
            value: 'plain text',
          },
        ],
        image: [
          {
            value: 'url',
          },
        ],
      },
    });
    const props = {
      document,
      columns: Immutable.fromJS(commonColumns.concat(templateColumns)),
      storeKey: 'library',
      onClick: onClickSpy,
    };
    component = renderConnected(TableRow, props, storeState);
    instance = component.instance();
  }
  describe('columns format', () => {
    render();
    const renderedColumns = component.find('td div');
    it('should render a column with the name of document', () => {
      expect(renderedColumns.at(1).props().children).toBe('document1');
    });
    it('should render a column with the creation date with ll format', () => {
      expect(renderedColumns.at(2).props().children).toBe(formattedCreationDate);
    });
    it('should render a column with the name of the template', () => {
      expect(renderedColumns.at(3).props().children).toBe('Template1');
    });
    it('should render a column with a date property with ll format', () => {
      expect(renderedColumns.at(4).props().children).toBe(formattedPropertyDate);
    });
    it('should render a column with the label of the thesaurus', () => {
      expect(renderedColumns.at(5).props().children).toBe('Colombia');
    });
    it('should render a column with the values as list of labels', () => {
      expect(renderedColumns.at(6).props().children).toBe('English, Español');
    });
    it('should render a column with rich text for markdown property', () => {
      expect(
        renderedColumns
          .at(7)
          .find(MarkdownViewer)
          .props().markdown
      ).toBe('**bold**');
    });
    it('should render a column with links to related entities separated by comma', () => {
      const links = renderedColumns.at(8).find(I18NLink);
      expect(renderedColumns.at(8).text()).toBe('<Connect(I18NLink) />, <Connect(I18NLink) />');
      expect(links.at(0).props().to).toBe('/entity/Entity1');
    });
    it('should render a column with a link', () => {
      expect(
        renderedColumns
          .at(9)
          .find(I18NLink)
          .props().to
      ).toBe('www.google.com');
    });
    it('should render a geolocation column', () => {
      const geolocationProps = renderedColumns.at(10).props().children.props;
      expect(geolocationProps.points).toEqual([{ lon: 2, lat: 46 }]);
      expect(geolocationProps.onlyForCards).toBe(true);
    });
    it('should render a text column', () => {
      expect(renderedColumns.at(11).props().children).toEqual('plain text');
    });
    it('should not render if the type is not supported', () => {
      expect(renderedColumns.at(12).props().children).toEqual(undefined);
    });
  });
  describe('onClick', () => {
    it('should call props.onClick with the event', () => {
      window.getSelection = jasmine.createSpy('getSelection');
      instance.onClick({});
      expect(onClickSpy).toHaveBeenCalledWith({}, document, true);
    });
  });
});
