import React, { useEffect, useMemo, useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Table, Button } from 'V2/Components/UI';
import { templatesAtom } from 'V2/atoms';
import { useAtomValue } from 'jotai';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { tableColumns } from './components/PXEntityTableElements';
import { TableTitle } from './components/TableTitle';
import { PXEntityTable, PXEntityApiResponse, PXTemplate } from './types';
import { PXTableFooter } from './components/PXTableFooter';
import { formatEntityData } from './utils/formatters';
import { EntityFilterSidePanel } from './components/EntityFilterSidePanel';
import { usePXActionModal } from './hooks/usePXActionModal';
import { NewEntitiesCountPill } from './components/PXTableElements';

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

  const {
    Modal: ConfirmExtractNewParagraphsModal,
    setShowModal: showConfirmExtractNewParagraphsModal,
  } = usePXActionModal({
    action: 'extractParagraphs',
  });

  const { Modal: DeleteParagraphsModal, setShowModal: showDeleteParagraphsModal } =
    usePXActionModal({
      action: 'deleteExtractors',
      actionParams: selected?.map(selection => selection._id) as string[],
    });

  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const [entityDatum] = pxEntitiesData;
    setSourceTemplate(entityDatum.template);
  }, [pxEntitiesData]);

  const [newEntitiesCount] = useState(
    pxEntitiesData.filter(entity => entity.status === 'NEW').length
  );

  const [searchParams] = useSearchParams();

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
          <Table
            data={pxEntitiesData}
            columns={tableColumns}
            enableSelections
            header={
              <TableTitle
                items={sourceTemplate ? [sourceTemplate] : []}
                Buttons={
                  filters.length > 0 && (
                    <Button
                      className="leading-4 flex gap-2 items-center text-gray-800"
                      styling="light"
                      onClick={() => setShowFilter(true)}
                    >
                      <Icon icon="filter" />
                      <Translate>Filters</Translate>
                    </Button>
                  )
                }
              />
            }
            onChange={({ selectedRows }) => {
              setSelected(() => pxEntitiesData.filter(ex => ex.rowId in selectedRows));
            }}
            defaultSorting={[{ id: '_id', desc: false }]}
            footer={
              <PXTableFooter
                totalPages={10}
                total={100}
                currentDataLength={10}
                searchParams={searchParams}
              />
            }
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
              <NewEntitiesCountPill count={newEntitiesCount} />
            </div>
          )}
          {selected?.length > 0 && (
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                className="disabled:opacity-50"
                onClick={() => showConfirmExtractNewParagraphsModal(true)}
                disabled={isSaving}
              >
                <Translate>Extract paragraphs</Translate>
              </Button>
              <Button
                type="button"
                color="error"
                onClick={() => showDeleteParagraphsModal(true)}
                disabled={isSaving}
              >
                <Translate>Delete</Translate>
              </Button>
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
      <DeleteParagraphsModal
        setIsProcessing={setIsSaving}
        onSuccess={() => {
          setSelected([]);
        }}
      />
      <ConfirmExtractNewParagraphsModal
        setIsProcessing={setIsSaving}
        onSuccess={() => {
          setSelected([]);
        }}
      />
      {filters.length > 0 && (
        <EntityFilterSidePanel
          availableFilters={filters}
          show={showFilter}
          setShow={setShowFilter}
        />
      )}
    </div>
  );
};

export { PXEntityDashboard };
