import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as pxEntitiesApi from 'app/V2/api/paragraphExtractor/entities';
import * as pxParagraphApi from 'app/V2/api/paragraphExtractor/paragraphs';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ClientTemplateSchema } from 'app/istore';
import { Table, Button } from 'V2/Components/UI';
import { Sidepanel } from 'V2/Components/UI/Sidepanel';
import { Translate } from 'app/I18N';
import { tableBuilder } from './components/PXParagraphTableElements';
import { TableTitle } from './components/TableTitle';
import { PXParagraphTable, PXParagraphApiResponse, PXEntityApiResponse } from './types';
import { getTemplateName } from './utils/getTemplateName';
import { ViewParagraph } from './components/ViewParagraph';

const formatParagraphData = (
  paragraphs: PXParagraphApiResponse[],
  templates: ClientTemplateSchema[]
): PXParagraphTable[] =>
  paragraphs.map(paragraph => {
    const templateName = getTemplateName(templates, paragraph.templateId);

    return {
      ...paragraph,
      rowId: paragraph._id || '',
      templateName,
    };
  });

const PXParagraphDashboard = () => {
  const {
    paragraphs = [],
    templates,
    extractorId,
    entity,
  } = useLoaderData() as {
    extractorId: string;
    entity: PXEntityApiResponse;
    paragraphs: PXParagraphApiResponse[];
    templates: ClientTemplateSchema[];
  };

  const [sidePanel, setSidePanel] = useState<boolean>(false);
  const [paragraphOnView, setParagraphOnView] = useState<PXParagraphApiResponse | undefined>(
    undefined
  );
  const pxParagraphData = useMemo(
    () => formatParagraphData(paragraphs, templates),
    [paragraphs, templates]
  );

  const openSidePanel = (id: string): void => {
    setSidePanel(true);
    const targetParagraph = paragraphs.find(paragraph => paragraph._id === id);
    setParagraphOnView(targetParagraph);
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
              ['Entities', `/settings/paragraph-extraction/${extractorId}/entities`],
            ])
          }
        />
        <SettingsContent.Body>
          <Table
            data={pxParagraphData}
            columns={tableBuilder({ onViewAction: openSidePanel })}
            header={<TableTitle items={['test', 'one', 'two']} />}
            defaultSorting={[{ id: '_id', desc: false }]}
          />
        </SettingsContent.Body>
      </SettingsContent>
      <Sidepanel
        withOverlay
        isOpen={sidePanel}
        closeSidepanelFunction={() => {
          setSidePanel(false);
        }}
        title={
          <span className="text-base font-semibold text-gray-500 leading-6 uppercase">Entity</span>
        }
      >
        <Sidepanel.Body>
          {paragraphOnView && <ViewParagraph paragraphData={paragraphOnView} />}
        </Sidepanel.Body>
        <Sidepanel.Footer className="px-4 py-3 border-t">
          <div className="flex gap-2 justify-end">
            <Button size="small" styling="outline">
              <Translate>View entity</Translate>
            </Button>
          </div>
        </Sidepanel.Footer>
      </Sidepanel>
    </div>
  );
};

const PXParagraphLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId = '', entityId = '' } }) => {
    const [paragraphs = [], templates, entity = {}] = await Promise.all([
      pxParagraphApi.getByParagraphExtractorId(extractorId),
      templatesAPI.get(headers),
      pxEntitiesApi.getById(entityId),
    ]);
    return { paragraphs, templates, extractorId, entity };
  };

export { PXParagraphDashboard, PXParagraphLoader };
