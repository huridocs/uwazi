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
import { PDFSidepanel } from './components/paragraphs/PDFSidepanel';

const PXParagraphDashboard = () => {
  const { extractorId } = useParams();
  const { rows, totalRows, extractor, sourceEntity } = useLoaderData() as PXParagraphLoaderResponse;
  const templates = useAtomValue(templatesAtom);
  const [sidePanel, setSidePanel] = useState(false);
  const [pdfSidepanel, setPdfSidepanel] = useState(false);
  const [paragraphOnView, setParagraphOnView] = useState<undefined | TablePXEntityParagraphRow>(
    undefined
  );

  const template = templates.find(temp => temp._id === extractor?.sourceTemplateId);
  const paragraphEntities = rows?.flatMap(row => [
    row,
    ...(row.subRows || []).map(subrow => subrow),
  ]);

  const onViewEntity = (entityId: string) => {
    const selectedParagraph = paragraphEntities?.find(paragraph => paragraph._id === entityId);
    setParagraphOnView(selectedParagraph);
    setSidePanel(true);
  };
  const entityTitle = sourceEntity?.title || '';

  return (
    <div className="h-full w-full overflow-y-auto" data-testid="settings-paragraph-extractor">
      <SettingsContent>
        <SettingsContent.Header
          title={entityTitle}
          path={
            new Map([
              ['Paragraph extraction', '/settings/paragraph-extraction'],
              [`${template?.name}`, `/settings/paragraph-extraction/${extractorId}/entities`],
            ])
          }
        />
        <SettingsContent.Body>
          <ParagraphsTable
            pxParagraphData={rows || []}
            viewParagraph={onViewEntity}
            totalRows={totalRows}
            openPDFSidepanel={setPdfSidepanel}
          />
        </SettingsContent.Body>
      </SettingsContent>
      <ViewParagraphSidePanel
        isSidePanelOpen={sidePanel}
        setIsSidePanelOpen={setSidePanel}
        paragraphOnView={paragraphOnView}
      />
      <PDFSidepanel
        entity={sourceEntity}
        setShowSidepanel={setPdfSidepanel}
        showSidepanel={pdfSidepanel}
      />
    </div>
  );
};

export { PXParagraphDashboard };
