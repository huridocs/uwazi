/* eslint-disable max-statements */
import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import * as extractorsAPI from 'app/V2/api/paragraphExtractor/extractors';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button, Table, ConfirmationModal } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { Template } from 'app/apiResponseTypes';
import { useSetAtom, useAtomValue } from 'jotai';
import { notificationAtom, templatesAtom } from 'V2/atoms';
import { tableColumns } from './components/PXTableElements';
import { PXTable, ParagraphExtractorApiResponse } from './types';
import { List } from './components/List';
import { ExtractorModal } from './components/ExtractorModal';
import { getTemplateName } from './utils/getTemplateName';

const formatExtractors = (
  extractors: ParagraphExtractorApiResponse[],
  templates: Template[]
): PXTable[] =>
  extractors.map(extractor => {
    const targetTemplateName = getTemplateName(templates, extractor.templateTo);
    const originTemplateNames = (extractor.templatesFrom || []).map(templateFrom =>
      getTemplateName(templates, templateFrom)
    );

    return {
      ...extractor,
      rowId: extractor._id || '',
      originTemplateNames,
      targetTemplateName,
    };
  });

const ParagraphExtractorDashboard = () => {
  const { extractors = [] } = useLoaderData() as {
    extractors: ParagraphExtractorApiResponse[];
  };

  const templates = useAtomValue(templatesAtom);
  const revalidator = useRevalidator();
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<PXTable[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [extractorModal, setExtractorModal] = useState(false);
  const setNotifications = useSetAtom(notificationAtom);

  const deleteExtractors = async () => {
    setIsSaving(true);
    const extractorIds = selected?.map(selection => selection._id) as string[];

    try {
      await extractorsAPI.remove(extractorIds);
      revalidator.revalidate();
      setNotifications({
        type: 'success',
        text: <Translate>Extractor/s deleted</Translate>,
      });
    } catch (error) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: error.json?.prettyMessage ? error.json.prettyMessage : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    revalidator.revalidate();
    setNotifications({
      type: 'success',
      text: <Translate>Paragraph Extractor added</Translate>,
    });
  };

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

      {confirmModal && (
        <ConfirmationModal
          header="Delete extractors"
          warningText="Do you want to delete the following items?"
          body={<List items={selected || []} />}
          onAcceptClick={async () => {
            await deleteExtractors();
            setConfirmModal(false);
            setSelected([]);
          }}
          onCancelClick={() => setConfirmModal(false)}
          dangerStyle
        />
      )}

      {extractorModal && (
        <ExtractorModal
          setShowModal={setExtractorModal}
          onClose={() => setExtractorModal(false)}
          onAccept={handleSave}
          templates={templates}
          extractor={selected?.length ? selected[0] : undefined}
        />
      )}
    </div>
  );
};

const ParagraphExtractorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const extractors = await extractorsAPI.get(headers);
    return { extractors };
  };

export { ParagraphExtractorDashboard, ParagraphExtractorLoader };
