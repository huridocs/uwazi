import React, { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { LanguageSchema } from 'shared/types/commonTypes';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { templatesAtom } from 'V2/atoms';
import { useLoaderData } from 'react-router';
import { Settings } from 'shared/types/settingsType';
import { PXParagraphTable, PXParagraphApiResponse, PXEntityApiResponse } from './types';
import { formatParagraphData } from './utils/formatters';
import { getLanguageName } from './utils/getLanguageName';
import { ParagraphsTable } from './components/paragraphs/Table';
import { ViewParagraphSidePanel } from './components/paragraphs/ViewParagraphSidePanel';

const PXParagraphDashboard = () => {
  const {
    paragraphs = [],
    extractorId,
    languages = [],
    settings,
  } = useLoaderData() as {
    extractorId: string;
    entity: PXEntityApiResponse;
    paragraphs: PXParagraphApiResponse[];
    languages: LanguageSchema[];
    settings: Settings;
  };

  const [sidePanel, setSidePanel] = useState<boolean>(false);
  const [paragraphOnView, setParagraphOnView] = useState<undefined | PXParagraphTable>(undefined);
  const [paragraphInfo, setParagraphInfo] = useState<undefined | PXParagraphTable>(undefined);
  const [entityLanguages, setEntityLanguages] = useState<string[]>([]);
  const templates = useAtomValue(templatesAtom);

  const pxParagraphData = useMemo(
    () => formatParagraphData(paragraphs, templates, settings),
    [paragraphs, templates, settings]
  );

  const [filters, setFilters] = useState<any[]>([]);

  useEffect(() => {
    if (pxParagraphData.length > 0) {
      const [pxParagraphDatum] = pxParagraphData;
      setParagraphInfo(pxParagraphDatum);

      const availableLanguages = [
        ...pxParagraphDatum.languages.map(lang => getLanguageName(languages, lang)),
        ...pxParagraphData
          .filter(datum => datum.paragraphCount === pxParagraphDatum.paragraphCount)
          .reduce((subRowLanguages: string[], curr) => {
            if (curr.subRows) {
              curr.subRows.forEach(subRow => {
                subRow.languages.forEach((lang: string) => {
                  const languageName = getLanguageName(languages, lang);
                  subRowLanguages.push(languageName);
                });
              });
            }
            return subRowLanguages;
          }, []),
      ];
      setEntityLanguages(availableLanguages);
      setFilters([
        {
          label: 'Languages',
          key: 'languages',
          options: availableLanguages.map(lang => ({
            key: lang,
            label: getLanguageName(languages, lang),
            count: 1,
          })),
        },
      ]);
    }
  }, [pxParagraphData, languages]);

  const openSidePanel = (id: string): void => {
    setSidePanel(true);
    const targetParagraph = pxParagraphData.find(paragraph => paragraph._id === id);
    if (targetParagraph) {
      setParagraphOnView({
        ...targetParagraph,
        languages: [getLanguageName(languages, targetParagraph.languages[0])],
      });
    }
  };

  return (
    <div
      className="tw-content"
      data-testid="settings-paragraph-extractor"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header
          title={paragraphInfo?.title || ''}
          path={
            new Map([
              ['Paragraph extraction', '/settings/paragraph-extraction'],
              [
                paragraphInfo?.template?.name || '',
                `/settings/paragraph-extraction/${extractorId}/entities`,
              ],
            ])
          }
        />
        <SettingsContent.Body>
          {paragraphInfo && (
            <ParagraphsTable
              pxParagraphData={pxParagraphData}
              paragraphInfo={paragraphInfo}
              entityLanguages={entityLanguages}
              filters={filters}
              viewParagraph={openSidePanel}
            />
          )}
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
