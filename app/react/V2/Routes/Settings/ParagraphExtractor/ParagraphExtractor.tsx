/* eslint-disable max-statements */
import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import * as extractorsAPI from 'app/V2/api/paragraphExtractor/extractors';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ClientTemplateSchema } from 'app/istore';
import { Button, Table } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { extractorsTableColumns } from './components/TableElements';
import { TableExtractor, Extractor } from './types';

const formatExtractors = (
  extractors: Extractor[],
  templates: ClientTemplateSchema[]
): TableExtractor[] =>
  (extractors || []).map(extractor => {
    const targetTemplateName =
      templates.find(template => template._id === extractor.templateTo)?.name ||
      extractor.templateTo;
    const originTemplateNames = extractor.templateFrom.map(templateFrom => {
      const namedTemplate = templates.find(template => template._id === templateFrom);
      return namedTemplate?.name || templateFrom;
    });
    return { ...extractor, rowId: extractor._id, originTemplateNames, targetTemplateName };
  });

const ParagraphExtractor = () => {
  const { extractors = [], templates } = useLoaderData() as {
    extractors: TableExtractor[];
    templates: ClientTemplateSchema[];
  };
  const [isSaving, setIsSaving] = useState(false);
  const revalidator = useRevalidator();
  const [selected, setSelected] = useState<TableExtractor[]>();
  const [confirmModal, setConfirmModal] = useState(false);
  const [extractorModal, setExtractorModal] = useState(false);
  // const setNotifications = useSetAtom(notificationAtom);

  // const deleteExtractors = async () => {};
  // const handleSave = async (extractor: IXExtractorInfo) => {};

  const paragraphExtractorData = useMemo(
    () => formatExtractors(extractors, templates),
    [extractors, templates]
  );

  return (
    <div
      className="tw-content"
      data-testid="settings-ix"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header title="Metadata extraction" />

        <SettingsContent.Body>
          <Table
            data={paragraphExtractorData}
            columns={extractorsTableColumns}
            header={
              <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                Extractors
              </Translate>
            }
            enableSelections
            onChange={() => {
              // setSelected(() => [].filter(ex => ex.rowId in selectedRows));
            }}
            defaultSorting={[{ id: 'name', desc: false }]}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2">
          {selected?.length === 1 ? (
            <Button type="button" onClick={() => setExtractorModal(true)} disabled={isSaving}>
              <Translate>Edit Extractor</Translate>
            </Button>
          ) : undefined}

          {selected?.length ? (
            <Button
              type="button"
              color="error"
              onClick={() => setConfirmModal(true)}
              disabled={isSaving}
            >
              <Translate>Delete</Translate>
            </Button>
          ) : (
            <Button type="button" onClick={() => setExtractorModal(true)} disabled={isSaving}>
              <Translate>Create Extractor</Translate>
            </Button>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

const ParagraphExtractorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const extractors = await extractorsAPI.get(headers);
    const templates = await templatesAPI.get(headers);
    return { extractors, templates };
  };

export { ParagraphExtractor, ParagraphExtractorLoader };
