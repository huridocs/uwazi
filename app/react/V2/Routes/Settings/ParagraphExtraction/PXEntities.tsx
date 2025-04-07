import React, { useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button } from 'V2/Components/UI';
import { notificationAtom, templatesAtom } from 'V2/atoms';
import type { PXEntityLoaderResponse, TablePXEntityRow } from 'V2/shared/ParagraphExtractionTypes';
import { EntityStatus } from 'V2/shared/ParagraphExtractionTypes';
import * as entitiesAPI from 'V2/api/paragraphExtractor/entities';
import { EntitiesTable } from './components/entities/Table';
import { generateDisplayPill } from './utils/generateDisplayPill';
import { ExtractEntitiesDialog } from './components/entities/ExtractEntitiesDialog';
import { EntityFilterSidepanel } from './components/FilterSidePanel/EntityFilterSidepanel';

const DisplayPill = generateDisplayPill({
  label: 'New',
});

const PXEntityDashboard = () => {
  const revalidator = useRevalidator();
  const templates = useAtomValue(templatesAtom);
  const { rows, totalRows, extractor } = useLoaderData() as PXEntityLoaderResponse;
  const sourceTemplate = templates.find(template => template._id === extractor?.sourceTemplateId);
  const newEntitiesCount = rows.filter(row => row.status.status === EntityStatus.New).length;
  const setNotifications = useSetAtom(notificationAtom);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<TablePXEntityRow[]>([]);

  const handleExtract = async () => {
    setIsSaving(true);

    try {
      if (!extractor) {
        setNotifications({
          type: 'error',
          text: <Translate>An error occurred</Translate>,
          details: <Translate>Cannot find extractor</Translate>,
        });
      } else {
        await entitiesAPI.extractParagraphs(extractor?._id);
        await revalidator.revalidate();
        setNotifications({
          type: 'success',
          text: <Translate>Paragraphs extracted</Translate>,
        });
      }
    } catch (error) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
      });
    }

    setIsSaving(false);
  };

  return (
    <div
      className="tw-content"
      data-testid="settings-paragraph-extractor"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header
          title={sourceTemplate?.name}
          contextId={sourceTemplate?._id}
          path={new Map([['Paragraph extraction', '/settings/paragraph-extraction']])}
        />
        <SettingsContent.Body>
          <EntitiesTable
            pxEntitiesData={rows}
            onSelectionChange={setSelected}
            sourceTemplate={sourceTemplate}
            totalRows={totalRows}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className="flex gap-2" highlighted={selected?.length > 0}>
          {selected?.length === 0 && (
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                className="disabled:opacity-50"
                onClick={handleExtract}
                disabled={isSaving}
              >
                <Translate>Extract new paragraphs</Translate>
              </Button>
              <DisplayPill count={newEntitiesCount} />
            </div>
          )}
          {selected?.length > 0 && (
            <div className="flex gap-2 items-center">
              <ExtractEntitiesDialog
                setIsProcessing={setIsSaving}
                onSuccess={() => {
                  setSelected([]);
                }}
                selected={selected}
                disabled={isSaving}
              />
              <div className="text-gray-500">
                <Translate>Selected</Translate>{' '}
                <span className="text-gray-900 font-semibold">{selected.length}</span>{' '}
                <Translate>of</Translate>{' '}
                <span className="text-gray-900 font-semibold">{totalRows}</span>
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
