/* eslint-disable max-statements */
import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import * as extractorsAPI from 'app/V2/api/paragraphExtractor/extractors';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ClientTemplateSchema } from 'app/istore';
import { Button, Table, ConfirmationModal } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { useSetAtom } from 'jotai';
import { notificationAtom } from 'V2/atoms';
import { extractorsTableColumns } from './components/TableElements';
import { TableExtractor, Extractor } from './types';
import { List } from './components/List';

const getTemplateName = (templates: ClientTemplateSchema[], targetId: string) => {
  const foundTemplate = templates.find(template => template._id === targetId);
  return foundTemplate?.name || targetId;
};

const formatExtractors = (
  extractors: Extractor[],
  templates: ClientTemplateSchema[]
): TableExtractor[] =>
  (extractors || []).map(extractor => {
    const targetTemplateName = getTemplateName(templates, extractor.templateTo);
    const originTemplateNames = extractor.templateFrom.map(templateFrom =>
      getTemplateName(templates, templateFrom)
    );

    return { ...extractor, rowId: extractor._id, originTemplateNames, targetTemplateName };
  });

const ParagraphExtractorDashboard = () => {
  const { extractors = [], templates } = useLoaderData() as {
    extractors: TableExtractor[];
    templates: ClientTemplateSchema[];
  };
  const [isSaving, setIsSaving] = useState(false);
  const revalidator = useRevalidator();
  const [selected, setSelected] = useState<TableExtractor[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);
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
        <SettingsContent.Header title="Paragraph extraction" />

        <SettingsContent.Body>
          {/* should create a component for empty data? */}
          <Table
            data={paragraphExtractorData}
            columns={extractorsTableColumns}
            header={
              <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                Extractors
              </Translate>
            }
            enableSelections
            onChange={({ selectedRows }) => {
              setSelected(() => paragraphExtractorData.filter(ex => ex.rowId in selectedRows));
            }}
            // what default sorting to use?
            defaultSorting={[{ id: 'status', desc: false }]}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2">
          {selected?.length === 1 ? (
            <Button type="button" onClick={() => {}} disabled={isSaving}>
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
            <Button type="button" onClick={() => {}} disabled={isSaving}>
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
    </div>
  );
};

const ParagraphExtractorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const extractors = await extractorsAPI.get();
    const templates = await templatesAPI.get(headers);
    return { extractors, templates };
  };

export { ParagraphExtractorDashboard, ParagraphExtractorLoader };
