import React, { useEffect, useMemo, useState } from 'react';
import { useLoaderData } from 'react-router';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button } from 'V2/Components/UI';
import { templatesAtom } from 'V2/atoms';
import { useAtomValue } from 'jotai';
import { Translate } from 'app/I18N';
import { PXEntityTable, PXEntityApiResponse, PXTemplate } from './types';
import { formatEntityData } from './utils/formatters';
import { EntitiesTable } from './components/entities/Table';
import { generateDisplayPill } from './utils/generateDisplayPill';
import { ExtractEntitiesDialog } from './components/entities/ExtractEntitiesDialog';
import { DeleteDialog } from './components/entities/DeleteDialog';
import { FilterSidePanel } from './components/FilterSidePanel';

const DisplayPill = generateDisplayPill({
  label: 'New',
});

const PXEntityDashboard = () => {
  const [sourceTemplate, setSourceTemplate] = useState<PXTemplate>();
  const { entities = [], filters = [] } = useLoaderData() as {
    entities: PXEntityApiResponse[];
    filters: any[];
  };

  const templates = useAtomValue(templatesAtom);
  const pxEntitiesData = useMemo(
    () => formatEntityData(entities, templates),
    [entities, templates]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<PXEntityTable[]>([]);

  useEffect(() => {
    const [entityDatum] = pxEntitiesData;
    setSourceTemplate(entityDatum.template);
  }, [pxEntitiesData]);

  const [newEntitiesCount] = useState(
    pxEntitiesData.filter(entity => entity.status === 'NEW').length
  );

  return (
    <div
      className="tw-content"
      data-testid="settings-paragraph-extractor"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header
          title={sourceTemplate?.name || ''}
          path={new Map([['Paragraph extraction', '/settings/paragraph-extraction']])}
        />
        <SettingsContent.Body>
          <EntitiesTable
            pxEntitiesData={pxEntitiesData}
            onSelectionChange={setSelected}
            sourceTemplate={sourceTemplate}
            filters={filters}
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
                <span className="text-gray-900 font-semibold">{pxEntitiesData.length}</span>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      {filters.length > 0 && <FilterSidePanel availableFilters={filters} />}
    </div>
  );
};

export { PXEntityDashboard };
