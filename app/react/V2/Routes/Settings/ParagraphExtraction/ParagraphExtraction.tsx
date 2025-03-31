import React, { useMemo, useState } from 'react';
import { useLoaderData } from 'react-router';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Translate } from 'app/I18N';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'V2/atoms';
import { PXTable, ParagraphExtractorApiResponse } from './types';
import { formatExtractors } from './utils/formatters';
import { CreateDialog } from './components/extractors/CreateDialog';
import { ExtractorsTable } from './components/extractors/Table';
import { DeleteDialog } from './components/extractors/DeleteDialog';

const ParagraphExtractorDashboard = () => {
  const { extractors = [] } = useLoaderData() as {
    extractors: ParagraphExtractorApiResponse[];
  };

  const templates = useAtomValue(templatesAtom);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<PXTable[]>([]);

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
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2" highlighted={selected?.length > 0}>
          {selected?.length ? (
            <div className="flex items-center gap-2 ">
              <DeleteDialog
                setIsProcessing={setIsSaving}
                onSuccess={() => {
                  setSelected([]);
                }}
                selected={selected}
              />
              <div className="text-gray-500">
                <Translate>Selected</Translate>{' '}
                <span className="font-semibold text-gray-900">{selected.length}</span>{' '}
                <Translate>of</Translate>{' '}
                <span className="font-semibold text-gray-900">{paragraphExtractorData.length}</span>
              </div>
            </div>
          ) : (
            <CreateDialog disabled={isSaving} />
          )}
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { ParagraphExtractorDashboard };
