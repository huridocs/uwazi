import React, { useEffect, useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as pxParagraphApi from 'app/V2/api/paragraphExtractor/paragraphs';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Table, Button } from 'V2/Components/UI';
import { Sidepanel } from 'V2/Components/UI/Sidepanel';
import { Template } from 'app/apiResponseTypes';
import { Translate, I18NApi } from 'app/I18N';
import { LanguageSchema } from 'shared/types/commonTypes';
import { RequestParams } from 'app/utils/RequestParams';
import { tableBuilder } from './components/PXParagraphTableElements';
import { TableTitle } from './components/TableTitle';
import { PXParagraphTable, PXParagraphApiResponse, PXEntityApiResponse } from './types';
import { getTemplateName } from './utils/getTemplateName';
import { ViewParagraph } from './components/ViewParagraph';
import { templatesAtom } from 'V2/atoms';
import { useAtomValue } from 'jotai';

const formatParagraphData = (
  paragraphs: PXParagraphApiResponse[],
  templates: Template[],
  languagePool: LanguageSchema[]
): PXParagraphTable[] =>
  paragraphs.map(paragraph => {
    const templateName = getTemplateName(templates, paragraph.templateId);
    const languages = paragraph.languages.map(language => {
      const { label = language } = languagePool.find(pool => pool.key === language) || {};
      return label;
    });
    return {
      ...paragraph,
      rowId: paragraph._id || '',
      templateName,
      languages,
    };
  });

const PXParagraphDashboard = () => {
  const {
    paragraphs = [],
    extractorId,
    languages = [],
  } = useLoaderData() as {
    extractorId: string;
    entity: PXEntityApiResponse;
    paragraphs: PXParagraphApiResponse[];
    languages: LanguageSchema[];
  };

  const [sidePanel, setSidePanel] = useState<boolean>(false);
  const [paragraphOnView, setParagraphOnView] = useState<undefined | PXParagraphTable>(undefined);
  const [paragraphInfo, setParagraphInfo] = useState<undefined | PXParagraphTable>(undefined);
  const templates = useAtomValue(templatesAtom);

  const pxParagraphData = useMemo(
    () => formatParagraphData(paragraphs, templates, languages),
    [paragraphs, templates, languages]
  );

  useEffect(() => {
    if (pxParagraphData.length) {
      setParagraphInfo(pxParagraphData[0]);
    }
  }, [pxParagraphData]);

  const openSidePanel = (id: string): void => {
    setSidePanel(true);
    const targetParagraph = pxParagraphData.find(paragraph => paragraph._id === id);
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
            header={
              paragraphInfo && (
                <TableTitle
                  items={[
                    paragraphInfo.templateName,
                    paragraphInfo.document,
                    paragraphInfo.languages.join(', '),
                  ]}
                />
              )
            }
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
          <span className="text-base font-semibold text-gray-500 leading-6 uppercase">
            <Translate>Entity</Translate>
          </span>
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
  async ({ params: { extractorId = '' } }) => {
    const [paragraphs = [], languages] = await Promise.all([
      pxParagraphApi.getByParagraphExtractorId(extractorId),
      I18NApi.getLanguages(new RequestParams({}, headers)),
    ]);
    return { paragraphs, extractorId, languages };
  };

export { PXParagraphDashboard, PXParagraphLoader };
