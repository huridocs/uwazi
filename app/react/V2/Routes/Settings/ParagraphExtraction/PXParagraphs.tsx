import React, { useState } from 'react';
import { useLoaderData, useParams } from 'react-router';
import { useAtomValue } from 'jotai';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import type {
  PXParagraphLoaderResponse,
  TablePXEntityParagraphRow,
} from 'V2/shared/ParagraphExtractionTypes';
import { templatesAtom } from 'V2/atoms';
import { ParagraphsTable } from './components/paragraphs/Table';
import { ViewParagraphSidePanel } from './components/paragraphs/ViewParagraphSidePanel';

const PXParagraphDashboard = () => {
  const { extractorId } = useParams();
  const { rows, totalRows, extractor, sourceEntity } = useLoaderData() as PXParagraphLoaderResponse;
  const templates = useAtomValue(templatesAtom);
  const [sidePanel, setSidePanel] = useState<boolean>(false);
  const [paragraphOnView] = useState<undefined | TablePXEntityParagraphRow>(undefined);

  const template = templates.find(temp => temp._id === extractor?.sourceTemplateId);

  // const openSidePanel = (id: string): void => {
  //   setSidePanel(true);
  //   const targetParagraph = pxParagraphData.find(paragraph => paragraph._id === id);
  //   if (targetParagraph) {
  //     setParagraphOnView({
  //       ...targetParagraph,
  //       languages: [getLanguageName(languages, targetParagraph.languages[0])],
  //     });
  //   }
  // };

  return (
    <div
      className="tw-content"
      data-testid="settings-paragraph-extractor"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header
          title={sourceEntity[0].title}
          path={
            new Map([
              ['Paragraph extraction', '/settings/paragraph-extraction'],
              [`${template?.name}`, `/settings/paragraph-extraction/${extractorId}/entities`],
            ])
          }
        />
        <SettingsContent.Body>
          <ParagraphsTable
            pxParagraphData={rows}
            filters={{}}
            // viewParagraph={openSidePanel
            viewParagraph={() => {
              //TODO: Update openSidePanel
            }}
            totalRows={totalRows}
          />
        </SettingsContent.Body>
      </SettingsContent>
      <ViewParagraphSidePanel
        isSidePanelOpen={sidePanel}
        setIsSidePanelOpen={setSidePanel}
        paragraphOnView={paragraphOnView}
      />
    </div>
  );
};

export { PXParagraphDashboard };
