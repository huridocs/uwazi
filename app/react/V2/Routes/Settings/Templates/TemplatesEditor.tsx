import React, { useState } from 'react';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Table } from 'V2/Components/UI/Table/Table';
import { Button } from 'V2/Components/UI/Button';
import { PropertySchema } from 'shared/types/commonTypes';
import { ColumnDef } from '@tanstack/react-table';
import { TemplateMetadata, TemplateMetadataValues } from './components/TemplateMetadata';

type PropertyRow = PropertySchema & {
  rowId: string;
  disableRowDnD?: boolean;
  disableRowSelection?: boolean;
};

// Placeholder for property editing
const defaultProperties: PropertyRow[] = [
  {
    rowId: '0',
    label: 'Title',
    name: 'title',
    type: 'text',
    disableRowDnD: true,
    disableRowSelection: true,
  },
  {
    rowId: '1',
    label: 'Date added',
    name: 'date_added',
    type: 'date',
    disableRowDnD: true,
    disableRowSelection: true,
  },
  {
    rowId: '2',
    label: 'Date modified',
    name: 'date_modified',
    type: 'date',
    disableRowDnD: true,
    disableRowSelection: true,
  },
];

const customProperties: PropertyRow[] = [
  {
    rowId: '3',
    label: 'Custom property 1',
    name: 'custom_property_1',
    type: 'text',
  },
];

const propertyColumns: ColumnDef<PropertyRow>[] = [
  {
    accessorKey: 'label',
    header: 'Property',
    cell: info => info.getValue(),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: info => info.getValue(),
  },
  {
    id: 'actions',
    header: 'Options',
    cell: () => <Button size="small">Edit</Button>,
  },
];

const TemplatesEditor = () => {
  const [metadata, setMetadata] = useState<TemplateMetadataValues>({
    name: '',
    color: '#C03B22',
    displayEntityView: false,
    entityViewPage: '',
  });
  const [properties, setProperties] = useState(customProperties);

  const allProperties = [...defaultProperties, ...properties];

  // Example pages list, replace with real data as needed
  const pages = [
    { value: 'page1', label: 'Page 1' },
    { value: 'page2', label: 'Page 2' },
  ];

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header
          title="Template name"
          path={new Map([['Templates', '/settings/templates']])}
        />
        <SettingsContent.Body>
          <Table
            columns={propertyColumns}
            data={allProperties}
            enableSelections
            dnd={{ enable: true }}
            header={<TemplateMetadata value={metadata} onChange={setMetadata} pages={pages} />}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex justify-between w-full">
            <Button color="primary" styling="outline">
              Add property
            </Button>
            <div className="flex gap-2">
              <Button color="primary">Save</Button>
              <Button color="error" styling="outline">
                Cancel
              </Button>
            </div>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { TemplatesEditor };
