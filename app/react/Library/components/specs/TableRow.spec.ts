/**
 * @jest-environment jsdom
 */
import Immutable from 'immutable';

import { renderConnected } from 'app/utils/test/renderConnected';
import { TableRow } from 'app/Library/components/TableRow';
import { TableCell } from 'app/Library/components/TableCell';
import { EntitySchema } from 'shared/types/entityType';

describe('TableRow', () => {
  const formattedCreationDate = 'Jul 23, 2020';
  const formattedPropertyDate = 'May 20, 2019';

  let component: any;
  let instance: any;
  let entity: EntitySchema;

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
    {
      label: 'Title',
      type: 'text',
      name: 'title',
      isCommonProperty: false,
    },
  ];
  const clickOnDocumentSpy = jasmine.createSpy('clickOnDocument');

  function render() {
    const timestampCreation = Date.UTC(2020, 6, 23).valueOf();
    const timestampProperty = Math.floor(Date.UTC(2019, 4, 20).valueOf() / 1000);
    const storeState = {
      settings: { collection: Immutable.fromJS({ dateFormat: 'dd-mm-yyyy' }) },
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
        title: [{ value: 'Mrs' }],
      },
    });
    const props = {
      entity,
      columns: commonColumns.concat(templateColumns),
      storeKey: 'library',
      clickOnDocument: clickOnDocumentSpy,
    };
    component = renderConnected(TableRow, props, storeState);
    instance = component.instance();
  }

  describe('row format', () => {
    render();
    const renderedTR = component.find('tr');

    it('should namespace the row with the template id', () => {
      expect(renderedTR.at(0).props().className).toContain('template-idTemplate1');
    });
  });

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

    it('should not replace common properties with metadata properties', () => {
      expect(renderedColumns.at(5).props().content.value).toBe('Mrs');
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
