/**
 * @jest-environment jsdom
 */
import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { TableRow } from 'app/Library/components/TableRow';
import { TableCell } from 'app/Library/components/TableCell';

describe('TableRow', () => {
  const formattedCreationDate = 'Jul 23, 2020';
  const formattedPropertyDate = 'May 20, 2019';
  let component: any;
  let instance: any;
  let entity: any;
  const commonColumns = [
    {
      label: 'Title1',
      type: 'text',
      name: 'title',
      isCommonProperty: true,
    },
    {
      label: 'Created at',
      type: 'date',
      name: 'creationDate',
      isCommonProperty: true,
    },
    {
      label: 'Template',
      type: 'text',
      name: 'templateName',
      isCommonProperty: true,
    },
  ];
  const templateColumns = [
    { label: 'Date', type: 'date', name: 'date', isCommonProperty: false },
    {
      label: 'Country',
      type: 'select',
      name: 'country',
      content: 'idThesauri1',
      isCommonProperty: false,
    },
  ];
  const clickOnDocumentSpy = jasmine.createSpy('clickOnDocument');

  function render() {
    const timestampCreation = Date.parse(formattedCreationDate).valueOf();
    const timestampProperty = Math.floor(Date.parse(formattedPropertyDate).valueOf() / 1000);
    const storeState = {
      library: { ui: Immutable.fromJS({ selectedDocuments: [{ _id: 'selectedEntity1' }] }) },
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
          properties: [{ label: 'Date', type: 'date', name: 'date' }],
        },
      ]),
    };
    entity = Immutable.fromJS({
      _id: 'selectedEntity1',
      title: 'entity1',
      creationDate: timestampCreation,
      template: 'idTemplate1',
      metadata: {
        date: [
          {
            value: timestampProperty,
          },
        ],
        country: [{ value: 'cv1', label: 'Colombia' }],
      },
    });
    const props = {
      entity,
      columns: Immutable.fromJS(commonColumns.concat(templateColumns)),
      storeKey: 'library',
      clickOnDocument: clickOnDocumentSpy,
    };
    component = renderConnected(TableRow, props, storeState);
    instance = component.instance();
  }
  describe('columns format', () => {
    render();
    const renderedColumns = component.find(TableCell);
    it('should render a column with the title of entity', () => {
      expect(renderedColumns.at(0).props().content.value).toBe('entity1');
    });
    it('should render a column with the creation date with ll format', () => {
      expect(renderedColumns.at(1).props().content.value).toBe(formattedCreationDate);
    });
    it('should render a column with the name of the template', () => {
      expect(renderedColumns.at(2).props().content.value).toBe('Template1');
    });
    it('should render a column with a date property with ll format', () => {
      expect(renderedColumns.at(3).props().content.value).toBe(formattedPropertyDate);
    });
    it('should render a column with the label of the thesaurus', () => {
      expect(renderedColumns.at(4).props().content.value).toBe('Colombia');
    });
  });

  describe('onClick', () => {
    it('should call props.onClick with the event', () => {
      window.getSelection = jasmine.createSpy('getSelection');
      const rowEvent = { preventDefault: () => {} };
      instance.onRowClick(rowEvent);
      expect(clickOnDocumentSpy).toHaveBeenCalledWith(rowEvent, entity, true);
    });
  });
});
