/* eslint-disable max-statements */
import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { useSetAtom } from 'jotai';
import * as extractorsAPI from 'app/V2/api/ix/extractors';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ClientTemplateSchema } from 'app/istore';
import { Button, ConfirmationModal, Table } from 'V2/Components/UI';
import { Translate, t } from 'app/I18N';
import { notificationAtom } from 'V2/atoms';
import { IXExtractorInfo } from 'V2/shared/types';
import { ExtractorModal } from './components/ExtractorModal';
import { Extractor, extractorsTableColumns } from './components/TableElements';
import { List } from './components/List';

const formatExtractors = (
  extractors: IXExtractorInfo[],
  templates: ClientTemplateSchema[]
): Extractor[] =>
  extractors.map(extractor => {
    let propertyType: Extractor['propertyType'] = 'text';
    let propertyLabel = '';

    const namedTemplates = extractor.templates.map(extractorTemplate => {
      const templateName =
        templates.find(template => template._id === extractorTemplate)?.name || extractorTemplate;
      return templateName;
    });

    templates.forEach(template => {
      const property = template.properties.find(
        templateProperty => templateProperty.name === extractor.property
      );

      if (!property && !propertyLabel) {
        propertyLabel = t(template._id, 'Title', null, false);
      }

      if (property) {
        propertyType = property.type as Extractor['propertyType'];

        if (!propertyLabel) {
          propertyLabel = t(template._id, property.label, null, false);
        }
      }
    });

    return { ...extractor, namedTemplates, propertyType, propertyLabel };
  });

const IXDashboard = () => {
  const { extractors, templates } = useLoaderData() as {
    extractors: IXExtractorInfo[];
    templates: ClientTemplateSchema[];
  };
  const [isSaving, setIsSaving] = useState(false);
  const revalidator = useRevalidator();
  const [selected, setSelected] = useState<Row<Extractor>[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [extractorModal, setExtractorModal] = useState(false);
  const setNotifications = useSetAtom(notificationAtom);

  const formmatedExtractors = useMemo(
    () => formatExtractors(extractors, templates),
    [extractors, templates]
  );

  const deleteExtractors = async () => {
    setIsSaving(true);
    const extractorIds = selected.map(selection => selection.original._id) as string[];

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

  const handleSave = async (extractor: IXExtractorInfo) => {
    setIsSaving(true);

    try {
      await extractorsAPI.save(extractor);
      revalidator.revalidate();
      setNotifications({
        type: 'success',
        text: <Translate>Saved successfully.</Translate>,
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

    setExtractorModal(false);
  };

  return (
    <div
      className="tw-content"
      data-testid="settings-ix"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header title="Metadata extraction dashboard" />

        <SettingsContent.Body>
          <Table<Extractor>
            data={formmatedExtractors}
            columns={extractorsTableColumns}
            title={<Translate>Extractors</Translate>}
            enableSelection
            onSelection={setSelected}
            initialState={{ sorting: [{ id: 'name', desc: false }] }}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2">
          {selected.length === 1 ? (
            <Button type="button" onClick={() => setExtractorModal(true)} disabled={isSaving}>
              <Translate>Edit Extractor</Translate>
            </Button>
          ) : undefined}

          {selected.length ? (
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
          body={<List items={selected} />}
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
          onAccept={async extractor => handleSave(extractor)}
          templates={templates}
          extractor={selected.length ? selected[0].original : undefined}
        />
      )}
    </div>
  );
};

const IXdashboardLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const extractors = await extractorsAPI.get(headers);
    const templates = await templatesAPI.get(headers);
    return { extractors, templates };
  };

export { IXDashboard, IXdashboardLoader };
