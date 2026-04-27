import React, { useMemo, useState } from 'react';
import { useLoaderData } from 'react-router';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Translate } from '#app/I18N/index.js';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import { Extractor } from '#V2/shared/ParagraphExtractionTypes.js';
import { Button } from '#V2/Components/UI/index.js';
import { PXTable } from './types.js';
import { formatExtractors } from './utils/formatters.js';
import { CreateDialog } from './components/extractors/CreateDialog/index.js';
import { ExtractorsTable } from './components/extractors/Table.js';
import { DeleteDialog } from './components/extractors/DeleteDialog/index.js';

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
    <div className="h-full w-full overflow-y-auto" data-testid="settings-paragraph-extractor">
      <SettingsContent>
        <SettingsContent.Header title="Paragraph Extraction" />
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
              <Button variant="danger" type="button" onClick={() => setdeletedialogIsopen(true)}>
                <Translate>Delete</Translate>
              </Button>
              <div className="[color:var(--color-theme-text-muted)]">
                <Translate>Selected</Translate>
                <span className="font-semibold [color:var(--color-theme-text-primary)]">
                  {selected.length}
                </span>
                <Translate>of</Translate>
                <span className="font-semibold [color:var(--color-theme-text-primary)]">
                  {paragraphExtractorData.length}
                </span>
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
