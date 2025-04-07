import React, { useState } from 'react';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import type {
  PXParagraphsLoaderResponse,
  TablePXEntityParagraphRow,
} from 'V2/shared/ParagraphExtractionTypes';
import { useLoaderData } from 'react-router';
import { ParagraphsTable } from './components/paragraphs/Table';
import { ViewParagraphSidePanel } from './components/paragraphs/ViewParagraphSidePanel';

const PXParagraphDashboard = () => {
  const { rows, totalRows } = useLoaderData() as PXParagraphsLoaderResponse;

  const [sidePanel, setSidePanel] = useState<boolean>(false);
  const [paragraphOnView] = useState<undefined | TablePXEntityParagraphRow>(undefined);

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
          title={'TODO: Property Name'}
          path={
            new Map([
              ['Paragraph extraction', '/settings/paragraph-extraction'],
              [
                'TODO: Template Name',
                // `/settings/paragraph-extraction/${extractorId}/entities`,
                '/settings/paragraph-extraction/extractorId/entities',
              ],
            ])
          }
        />
        <SettingsContent.Body>
          <ParagraphsTable
            pxParagraphData={rows}
            paragraphInfo={rows[0]}
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
