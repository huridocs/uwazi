import React, { useState } from 'react';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Table } from 'V2/Components/UI/Table/Table';
import { Button } from 'V2/Components/UI/Button';
import { PropertySchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N/Translate';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router';
import * as templatesAPI from 'V2/api/templates';
import { propertyColumns } from './components/TemplateEditorTableComponents';
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

// Loader function for TemplatesEditor
const templatesEditorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    if (params.templateId) {
      const templates = await templatesAPI.get(headers);
      const template = templates.find((t: any) => t._id === params.templateId);
      return template || {};
    }
    return {};
  };

const TemplatesEditor = () => {
  // Use useLoaderData to get the loaded template if available
  const loadedTemplate = useLoaderData() as any;
  const [metadata, setMetadata] = useState<TemplateMetadataValues>({
    name: loadedTemplate.name,
    color: loadedTemplate.color,
    entityViewPage: loadedTemplate.entityViewPage,
  });
  const [properties] = useState(loadedTemplate.properties || []);
  const [commonProperties] = useState(loadedTemplate.commonProperties || defaultProperties);

  const allProperties = [...commonProperties, ...properties];

  // Example pages list, replace with real data as needed
  const pages = [
    { value: 'page1', label: 'Page 1' },
    { value: 'page2', label: 'Page 2' },
  ];

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header
          title={metadata.name}
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
            <div className="flex gap-2">
              <Button color="primary">
                <Translate>Add property</Translate>
              </Button>
              <Button color="primary" styling="outline">
                <Translate>Add thesaurus</Translate>
              </Button>
              <Button color="primary" styling="outline">
                <Translate>Add relationship type</Translate>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button styling="outline">
                <Translate>Cancel</Translate>
              </Button>
              <Button color="success">
                <Translate>Save</Translate>
              </Button>
            </div>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { TemplatesEditor, templatesEditorLoader };
