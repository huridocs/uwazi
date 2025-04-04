import React, { useState } from 'react';
import { useLoaderData, useParams } from 'react-router';
import { useAtomValue } from 'jotai';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import type { TablePXEntityParagraphRow } from 'V2/shared/ParagraphExtractionTypes';
import { templatesAtom } from 'V2/atoms';
import { ParagraphsTable } from './components/paragraphs/Table';
import { ViewParagraphSidePanel } from './components/paragraphs/ViewParagraphSidePanel';
import { PXParagraphsLoaderResponse } from './types';

const PXParagraphDashboard = () => {
  const { extractorId } = useParams();
  const { paragraphs, templateId, propertyId } = useLoaderData() as PXParagraphsLoaderResponse;
  const templates = useAtomValue(templatesAtom);
  const [sidePanel, setSidePanel] = useState<boolean>(false);
  const [paragraphOnView] = useState<undefined | TablePXEntityParagraphRow>(undefined);

  const template = templates.find(temp => temp._id === templateId);
  const propertyLabel = template?.properties?.find(
    metedataProperties => metedataProperties._id === propertyId
  )?.label;

  // const pxParagraphData = useMemo(
  //   () => formatParagraphData(paragraphs, templates, settings),
  //   [paragraphs, templates, settings]
  // );

  // useEffect(() => {
  //   if (pxParagraphData.length > 0) {
  //     const [pxParagraphDatum] = pxParagraphData;
  //     setParagraphInfo(pxParagraphDatum);

  //     const availableLanguages = [
  //       ...pxParagraphDatum.languages.map(lang => getLanguageName(languages, lang)),
  //       ...pxParagraphData
  //         .filter(datum => datum.paragraphCount === pxParagraphDatum.paragraphCount)
  //         .reduce((subRowLanguages: string[], curr) => {
  //           if (curr.subRows) {
  //             curr.subRows.forEach(subRow => {
  //               subRow.languages.forEach((lang: string) => {
  //                 const languageName = getLanguageName(languages, lang);
  //                 subRowLanguages.push(languageName);
  //               });
  //             });
  //           }
  //           return subRowLanguages;
  //         }, []),
  //     ];
  //     setEntityLanguages(availableLanguages);
  //   }
  // }, [pxParagraphData, languages]);

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
          title={propertyLabel}
          contextId={template?._id}
          path={
            new Map([
              ['Paragraph extraction', '/settings/paragraph-extraction'],
              [`${template?.name}`, `/settings/paragraph-extraction/${extractorId}/entities`],
            ])
          }
        />
        <SettingsContent.Body>
          <ParagraphsTable
            pxParagraphData={paragraphs.rows}
            paragraphInfo={paragraphs.rows[0]}
            filters={{}}
            // viewParagraph={openSidePanel
            viewParagraph={() => {
              //TODO: Update openSidePanel
            }}
            totalRows={paragraphs.totalRows}
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
