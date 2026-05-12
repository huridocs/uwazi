import React, { useEffect, useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button } from '#V2/Components/UI/index.js';
import { templatesAtom } from '#V2/atoms/index.js';
import type {
  PXEntityLoaderResponse,
  TablePXEntityRow,
} from '#V2/shared/ParagraphExtractionTypes.js';
import { EntityStatus } from '#V2/shared/ParagraphExtractionTypes.js';
import * as entitiesAPI from '#V2/api/paragraphExtractor/entities.js';
import { EntitiesTable } from './components/entities/Table.js';
import { generateDisplayPill } from './utils/generateDisplayPill.js';
import { ExtractEntitiesDialog } from './components/entities/ExtractEntitiesDialog/index.js';
import { EntityFilterSidepanel } from './components/FilterSidePanel/EntityFilterSidepanel.js';
import { filterSidepanelStatusAtom } from './components/FilterSidePanel/filterSidepanelAtom.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

const DisplayPill = generateDisplayPill({
  label: 'New',
});

const POLL_INTERVAL_SECONDS = 25;

const PXEntityDashboard = () => {
  const revalidator = useRevalidator();
  const templates = useAtomValue(templatesAtom);
  const { rows, totalRows, extractor, page } = useLoaderData() as PXEntityLoaderResponse;
  const setFilterSidepanelStatus = useSetAtom(filterSidepanelStatusAtom);
  const sourceTemplate = templates.find(template => template._id === extractor?.sourceTemplateId);
  const { notify } = useRequestStatus();
  const [data, setData] = useState<TablePXEntityRow[]>(rows);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<TablePXEntityRow[]>([]);
  const previousPageRef = React.useRef(page);
  const newEntitiesCount = data.filter(row => row.status.status === EntityStatus.New).length;

  const handleExtract = async () => {
    setIsSaving(true);

    try {
      if (!extractor) {
        notify(
          'error',
          t('System', 'An error occurred', null, false),
          undefined,
          t('System', 'Cannot find extractor', null, false)
        );
      } else {
        await entitiesAPI.extractParagraphs(extractor?._id);
        await revalidator.revalidate();
        notify(
          'success',
          t(
            'System',
            'The process of extracting the paragraphs has successfully started. Check the Status column for updates on the process.',
            null,
            false
          )
        );
        await revalidator.revalidate();
      }
    } catch (error) {
      notify('error', t('System', 'An error occurred', null, false));
    }

    setIsSaving(false);
  };

  useEffect(() => {
    setFilterSidepanelStatus(extractor?.statusCount || {});

    if (page !== previousPageRef.current) {
      setData(rows);
      previousPageRef.current = page;
    } else {
      setData(prevRows =>
        prevRows.map(row => {
          const newStatus = rows.find(r => r.entity._id === row.entity._id)?.status;
          if (newStatus && newStatus.status !== row.status.status) {
            // Only reassign if status changed
            // eslint-disable-next-line no-param-reassign
            row.status = { ...newStatus };
          }
          return row;
        })
      );
    }
  }, [extractor?.statusCount, page, rows, setFilterSidepanelStatus]);

  useEffect(() => {
    const interval = setInterval(async () => {
      await revalidator.revalidate();
    }, POLL_INTERVAL_SECONDS * 1000);

    return () => clearInterval(interval);
    // Only run this effect once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto" data-testid="settings-paragraph-extractor">
      <SettingsContent>
        <SettingsContent.Header
          title={sourceTemplate?.name}
          contextId={sourceTemplate?._id}
          path={new Map([['Paragraph extraction', '/settings/paragraph-extraction']])}
        />
        <SettingsContent.Body>
          <EntitiesTable
            pxEntitiesData={data}
            onSelectionChange={setSelected}
            sourceTemplate={sourceTemplate}
            totalRows={totalRows}
            initialSelection={selected}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className="flex gap-2" highlighted={selected?.length > 0}>
          {selected?.length === 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                className="disabled:opacity-50"
                onClick={handleExtract}
                disabled={!newEntitiesCount || isSaving}
              >
                <Translate>Extract new paragraphs</Translate>
              </Button>
              {Boolean(newEntitiesCount) && <DisplayPill count={newEntitiesCount} />}
            </div>
          )}
          {selected?.length > 0 && (
            <div className="flex items-center gap-2">
              <ExtractEntitiesDialog
                setIsProcessing={setIsSaving}
                onSuccess={async () => {
                  setSelected([]);
                  await revalidator.revalidate();
                }}
                selected={selected}
                disabled={isSaving}
              />
              <div className="text-(--color-theme-text-secondary)">
                <Translate>Selected</Translate>{' '}
                <span className="font-semibold text-(--color-theme-text-primary)">
                  {selected.length}
                </span>{' '}
                <Translate>of</Translate>{' '}
                <span className="font-semibold text-(--color-theme-text-primary)">
                  {totalRows}
                </span>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <EntityFilterSidepanel />
    </div>
  );
};

export { PXEntityDashboard };
