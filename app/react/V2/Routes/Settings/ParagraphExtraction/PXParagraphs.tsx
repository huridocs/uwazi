import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as pxParagraphApi from 'app/V2/api/paragraphExtractor/paragraphs';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ClientTemplateSchema } from 'app/istore';
import { Table } from 'V2/Components/UI';
import { Sidepanel } from 'V2/Components/UI/Sidepanel';
import { tableColumns } from './components/PXParagraphTableElements';
import { TableTitle } from './components/TableTitle';
import { PXParagraphTable, PXParagraphApiResponse } from './types';
import { getTemplateName } from './utils/getTemplateName';

const formatExtractors = (
  entities: PXParagraphApiResponse[],
  templates: ClientTemplateSchema[]
): PXParagraphTable[] =>
  entities.map(extractor => {
    const templateName = getTemplateName(templates, extractor.templateId);

    return {
      ...extractor,
      rowId: extractor._id || '',
      templateName,
    };
  });

const PXParagraphDashboard = () => {
  const { entities = [], templates } = useLoaderData() as {
    entities: PXParagraphApiResponse[];
    templates: ClientTemplateSchema[];
  };

  const [sidePanel, setSidePanel] = useState<boolean>(false);

  const pxParagraphData = useMemo(
    () => formatExtractors(entities, templates),
    [entities, templates]
  );

  const openSidePanel = () => {
    setSidePanel(true);
  };

  return (
    <div
      className="tw-content"
      data-testid="settings-paragraph-extractor"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header
          title="Paragraphs"
          path={
            new Map([
              ['Paragraph extraction', '/settings/paragraph-extraction'],
              ['Entities', '/settings/paragraph-extraction/1/entities'],
            ])
          }
        />
        <SettingsContent.Body>
          <Table
            data={pxParagraphData}
            columns={tableColumns}
            header={<TableTitle items={['test', 'one', 'two']} />}
            defaultSorting={[{ id: '_id', desc: false }]}
          />
        </SettingsContent.Body>
      </SettingsContent>
      <Sidepanel isOpen={sidePanel} closeSidepanelFunction={() => {}}>
        <div>test</div>
      </Sidepanel>
    </div>
  );
};

const PXParagraphLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId = '' } }) => {
    const [entities = [], templates] = await Promise.all([
      pxParagraphApi.getByParagraphExtractorId(extractorId),
      templatesAPI.get(headers),
    ]);
    return { entities, templates };
  };

export { PXParagraphDashboard, PXParagraphLoader };
