/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { fireEvent, screen } from '@testing-library/react';

import { renderConnectedContainer } from 'app/utils/test/renderConnected';
import { TableRow } from 'app/Library/components/TableRow';
import { EntitySchema } from 'shared/types/entityType';
import { TableViewColumn } from 'app/istore';
import { IImmutable } from 'shared/types/Immutable';

describe('TableRow', () => {
  const formattedPropertyDate = 'May 20, 2019';

  const commonColumns: TableViewColumn[] = [
    {
      label: 'Title1',
      type: 'text',
      name: 'title',
      isCommonProperty: true,
      hidden: false,
    },
    {
      label: 'Created at',
      type: 'date',
      name: 'creationDate',
      isCommonProperty: true,
      hidden: false,
    },
    {
      label: 'Template',
      type: 'text',
      name: 'templateName',
      isCommonProperty: true,
      hidden: false,
    },
  ];
  const templateColumns: TableViewColumn[] = [
    { label: 'Date', type: 'date', name: 'date', isCommonProperty: false, hidden: false },
    {
      label: 'Country',
      type: 'select',
      name: 'country',
      content: 'idThesauri1',
      isCommonProperty: false,
      hidden: false,
    },
    {
      label: 'Summary',
      type: 'text',
      name: 'summary',
      isCommonProperty: false,
      hidden: false,
    },
  ];
  const clickOnDocumentSpy = jasmine.createSpy('clickOnDocument');
  const timestampCreation = Date.UTC(2020, 6, 23).valueOf();
  const timestampProperty = Math.floor(Date.UTC(2019, 4, 20).valueOf() / 1000);
  const entity: IImmutable<EntitySchema> = Immutable.fromJS({
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
      summary: [{ value: 'Mrs' }],
    },
  });
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
  const props = {
    entity,
    columns: commonColumns.concat(templateColumns),
    clickOnDocument: clickOnDocumentSpy,
    multipleSelection: false,
    setMultipleSelection: () => {},
  };

  function render() {
    renderConnectedContainer(
      <table>
        <tbody>
          <TableRow {...props} />
        </tbody>
      </table>,
      () => storeState
    );
  }

  describe('row format', () => {
    it('should namespace the row with the template id', () => {
      render();
      const row = screen.getByRole('row');
      expect(row.className).toContain('template-idTemplate1');
    });
  });

  describe('columns format', () => {
    it('should render a column with the expected columns', () => {
      render();
      const renderedColumns = screen.getAllByRole('cell');
      const content = renderedColumns.map(col => col.textContent);
      expect(content).toEqual([
        'entity1',
        expect.stringMatching(/^Jul 2[2|3], 2020$/),
        'Template1',
        formattedPropertyDate,
        'Colombia',
        'Mrs',
      ]);
    });
  });

  describe('onClick', () => {
    it('should call props.onClick with the event', () => {
      render();
      const row = screen.getByRole('row');
      fireEvent.click(row, { shiftKey: true });
      expect(clickOnDocumentSpy).toHaveBeenCalledWith(
        { ctrlKey: false, metaKey: false, shiftKey: true },
        entity,
        true,
        true
      );
    });
  });
});
