import React, { useMemo, useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button, Table } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'V2/atoms';
import { tableColumns, NoDataMessage } from './components/PXTableElements';
import { PXTable, ParagraphExtractorApiResponse } from './types';
import { formatExtractors } from './utils/formatters';
import { PXTableFooter } from './components/PXTableFooter';
import { usePXActionModal } from './hooks/usePXActionModal';
import { useAddExtractorModal } from './hooks/useAddExtractorModal';

const ParagraphExtractorDashboard = () => {
  const { extractors = [] } = useLoaderData() as {
    extractors: ParagraphExtractorApiResponse[];
  };

  const templates = useAtomValue(templatesAtom);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<PXTable[]>([]);

  const { AddExtractorModal, setShowModal: showAddExtractorModal } = useAddExtractorModal();
  const { Modal: ConfirmDeleteModal, setShowModal: showConfirmModal } = usePXActionModal({
    action: 'deleteExtractor',
    actionParams: selected?.map(selection => selection._id) as string[],
  });

  const paragraphExtractorData = useMemo(
    () => formatExtractors(extractors, templates),
    [extractors, templates]
  );

  const [searchParams] = useSearchParams();

  return (
    <div
      className="tw-content"
      data-testid="settings-paragraph-extractor"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header title="Paragraph extraction" />
        <SettingsContent.Body>
          <Table
            data={paragraphExtractorData}
            columns={tableColumns}
            header={
              <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                Extractors
              </Translate>
            }
            enableSelections
            onChange={({ selectedRows }) => {
              setSelected(() => paragraphExtractorData.filter(ex => ex.rowId in selectedRows));
            }}
            defaultSorting={[{ id: '_id', desc: false }]}
            noDataMessage={<NoDataMessage />}
            footer={
              <PXTableFooter
                totalPages={10}
                currentDataLength={10}
                total={100}
                searchParams={searchParams}
              />
            }
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2" highlighted={selected?.length > 0}>
          {selected?.length ? (
            <div className="flex gap-2 items-center ">
              <Button
                type="button"
                color="error"
                onClick={() => showConfirmModal(true)}
                disabled={isSaving}
              >
                <Translate>Delete</Translate>
              </Button>
              <div className="text-gray-500">
                <Translate>Selected</Translate>{' '}
                <span className="text-gray-900 font-semibold">{selected.length}</span>{' '}
                <Translate>of</Translate>{' '}
                <span className="text-gray-900 font-semibold">{paragraphExtractorData.length}</span>
              </div>
            </div>
          ) : (
            <Button type="button" onClick={() => showAddExtractorModal(true)} disabled={isSaving}>
              <Translate>Add extractor</Translate>
            </Button>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <ConfirmDeleteModal
        setIsProcessing={setIsSaving}
        onSuccess={() => {
          setSelected([]);
        }}
      />
      <AddExtractorModal extractor={selected?.length ? selected[0] : undefined} />
    </div>
  );
};

export { ParagraphExtractorDashboard };
