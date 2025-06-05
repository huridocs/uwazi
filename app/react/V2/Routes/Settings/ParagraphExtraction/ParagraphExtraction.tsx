import React, { useMemo, useState } from 'react';
import { useLoaderData } from 'react-router';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Translate } from 'app/I18N';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'V2/atoms';
import { Extractor } from 'V2/shared/ParagraphExtractionTypes';
import { Button } from 'app/V2/Components/UI';
import { PXTable } from './types';
import { formatExtractors } from './utils/formatters';
import { CreateDialog } from './components/extractors/CreateDialog';
import { ExtractorsTable } from './components/extractors/Table';
import { DeleteDialog } from './components/extractors/DeleteDialog';

const ParagraphExtractorDashboard = () => {
  const { extractors = [] } = useLoaderData() as {
    extractors: Extractor[];
  };
  const templates = useAtomValue(templatesAtom);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<PXTable[]>([]);
  const [deletedialogIsopen, setdeletedialogIsopen] = useState(false);
  const [createDialogIsopen, setCreateDialogIsopen] = useState(false);

  const paragraphExtractorData = useMemo(
    () => formatExtractors(extractors, templates),
    [extractors, templates]
  );

  return (
    <div
      className="tw-content"
      data-testid="settings-paragraph-extractor"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header title="Paragraph extraction" />
        <SettingsContent.Body>
          <ExtractorsTable
            paragraphExtractorData={paragraphExtractorData}
            onSelectionChange={setSelected}
          />
          <DeleteDialog
            setIsProcessing={setIsSaving}
            onSuccess={() => {
              setSelected([]);
            }}
            selected={selected}
            isOpen={deletedialogIsopen}
            setIsOpen={setdeletedialogIsopen}
          />
          <CreateDialog isOpen={createDialogIsopen} setIsOpen={setCreateDialogIsopen} />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2" highlighted={selected?.length > 0}>
          {selected?.length ? (
            <div className="flex items-center gap-2 ">
              <Button color="error" type="button" onClick={() => setdeletedialogIsopen(true)}>
                <Translate>Delete</Translate>
              </Button>
              <div className="text-gray-500">
                <Translate>Selected</Translate>
                <span className="font-semibold text-gray-900">{selected.length}</span>
                <Translate>of</Translate>
                <span className="font-semibold text-gray-900">{paragraphExtractorData.length}</span>
              </div>
            </div>
          ) : (
            <Button type="button" onClick={() => setCreateDialogIsopen(true)} disabled={isSaving}>
              <Translate>Add extractor</Translate>
            </Button>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { ParagraphExtractorDashboard };
