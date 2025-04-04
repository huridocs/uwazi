import React, { useMemo, useState } from 'react';
import { useLoaderData, useRouteLoaderData } from 'react-router';
import { useAtomValue } from 'jotai';
import { Translate } from 'app/I18N';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button } from 'V2/Components/UI';
import { templatesAtom } from 'V2/atoms';
import type { PXEntityLoaderResponse, TablePXEntityRow } from 'V2/shared/ParagraphExtractionTypes';
import { EntityStatus } from 'V2/shared/ParagraphExtractionTypes';
import { EntitiesTable } from './components/entities/Table';
import { generateDisplayPill } from './utils/generateDisplayPill';
import { ExtractEntitiesDialog } from './components/entities/ExtractEntitiesDialog';
import { DeleteDialog } from './components/entities/DeleteDialog';
import { EntityFilterSidepanel } from './components/FilterSidePanel/EntityFilterSidepanel';

const DisplayPill = generateDisplayPill({
  label: 'New',
});

const PXEntityDashboard = () => {
  const templates = useAtomValue(templatesAtom);
  const { rows, page, totalRows, extractor } = useLoaderData() as PXEntityLoaderResponse;
  const sourceTemplate = templates.find(template => template._id === extractor?.sourceTemplateId);
  const newEntitiesCount = rows.filter(row => row.status.status === EntityStatus.New).length;

  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<TablePXEntityRow[]>([]);

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
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className="flex gap-2" highlighted={selected?.length > 0}>
          {selected?.length === 0 && (
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                className="disabled:opacity-50"
                onClick={() => console.log('extract new paragraphs')}
                disabled={isSaving || newEntitiesCount === 0}
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
              <DeleteDialog
                setIsProcessing={setIsSaving}
                disabled={isSaving}
                onSuccess={() => {
                  setSelected([]);
                }}
                selected={selected}
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
