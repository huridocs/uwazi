import React, { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { LanguageSchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Table, Button } from 'V2/Components/UI';
import { Sidepanel } from 'V2/Components/UI/Sidepanel';
import { templatesAtom } from 'V2/atoms';
import { useLoaderData, useSearchParams } from 'react-router';
import { Settings } from 'shared/types/settingsType';
import { Icon } from 'app/UI';
import { tableBuilder } from './components/PXParagraphTableElements';
import { TableTitle } from './components/TableTitle';
import { PXParagraphTable, PXParagraphApiResponse, PXEntityApiResponse } from './types';
import { ViewParagraph } from './components/ViewParagraph';
import { formatParagraphData } from './utils/formatters';
import { PXTableFooter } from './components/PXTableFooter';
import { getLanguageName } from './utils/getLanguageName';
import { EntityFilterSidePanel } from './components/EntityFilterSidePanel';

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

  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<any[]>([]);
  const [searchParams] = useSearchParams();

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
          <Table
            data={pxParagraphData}
            columns={tableBuilder({ onViewAction: openSidePanel })}
            header={
              paragraphInfo && (
                <TableTitle
                  items={[
                    { ...paragraphInfo.template },
                    ...entityLanguages.map(language => ({ name: language })),
                  ]}
                  Buttons={
                    filters.length > 0 && (
                      <div className="flex gap-3">
                        <Button
                          className="leading-4 flex gap-2 items-center text-gray-800"
                          styling="light"
                          onClick={() => setShowFilter(true)}
                        >
                          <Icon icon="filter" />
                          <Translate>Filters</Translate>
                        </Button>
                        <Button
                          styling="light"
                          className="leading-4 flex gap-2 items-center text-gray-800"
                        >
                          <Translate>Open</Translate>
                        </Button>
                      </div>
                    )
                  }
                />
              )
            }
            defaultSorting={[{ id: '_id', desc: false }]}
            footer={
              <PXTableFooter
                totalPages={10}
                currentDataLength={10}
                total={100}
                searchParams={searchParams}
              />
            }
            groupColumnPosition={3}
          />
        </SettingsContent.Body>
      </SettingsContent>
      {filters.length > 0 && (
        <EntityFilterSidePanel
          availableFilters={filters}
          show={showFilter}
          setShow={setShowFilter}
        />
      )}
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

export { PXParagraphDashboard };
