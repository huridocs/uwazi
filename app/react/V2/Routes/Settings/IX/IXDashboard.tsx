import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { useSetRecoilState } from 'recoil';
import * as ixAPI from 'V2/api/ix';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ClientTemplateSchema } from 'app/istore';
import { Button, ConfirmationModal, Table } from 'V2/Components/UI';
import { Translate, t } from 'app/I18N';
import { notificationAtom } from 'V2/atoms';
import { IXExtractorInfo } from 'V2/shared/types';
import { ExtractorModal } from './components/ExtractorModal';
import { Extractor, tableColumns } from './components/TableElements';
import { List } from './components/List';

const formatExtractors = (
  extractors: IXExtractorInfo[],
  templates: ClientTemplateSchema[]
): Extractor[] =>
  extractors.map(extractor => {
    let propertyType: Extractor['propertyType'] = 'text';
    let propertyLabel = t('System', 'Title', null, false);

    const namedTemplates = extractor.templates.map(extractorTemplate => {
      const templateName =
        templates.find(template => template._id === extractorTemplate)?.name || extractorTemplate;
      return templateName;
    });

    templates.forEach(template => {
      const property = template.properties.find(
        templateProperty => templateProperty.name === extractor.property
      );

      if (property) {
        propertyType = property.type as Extractor['propertyType'];
        propertyLabel = t(template._id, property.label, null, false);
      }
    });

    return { ...extractor, namedTemplates, propertyType, propertyLabel };
  });

const IXDashboard = () => {
  const { extractors, templates } = useLoaderData() as {
    extractors: IXExtractorInfo[];
    templates: ClientTemplateSchema[];
  };
  const revalidator = useRevalidator();
  const [selected, setSelected] = useState<Row<Extractor>[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [extractorModal, setExtractorModal] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);

  const formmatedExtractors = useMemo(
    () => formatExtractors(extractors, templates),
    [extractors, templates]
  );

  const deleteExtractors = async () => {
    const extractorIds = selected.map(selection => selection.original._id) as string[];

    try {
      await ixAPI.remove(extractorIds);
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
    }
  };

  const handleSave = async (extractor: IXExtractorInfo) => {
    try {
      if (extractor._id) {
        await ixAPI.update(extractor);
      } else {
        await ixAPI.save(extractor);
      }
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
    }

    setExtractorModal(false);
  };

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Metadata extraction dashboard" />

        <SettingsContent.Body>
          <Table<Extractor>
            data={formmatedExtractors}
            columns={tableColumns}
            title={<Translate>Extractors</Translate>}
            enableSelection
            onSelection={setSelected}
            initialState={{ sorting: [{ id: 'name', desc: false }] }}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer className="flex gap-2">
          {selected.length === 1 ? (
            <Button size="small" type="button" onClick={() => setExtractorModal(true)}>
              <Translate>Edit Extractor</Translate>
            </Button>
          ) : undefined}

          {selected.length ? (
            <Button size="small" type="button" color="error" onClick={() => setConfirmModal(true)}>
              <Translate>Delete</Translate>
            </Button>
          ) : undefined}

          {!selected.length ? (
            <Button size="small" type="button" onClick={() => setExtractorModal(true)}>
              <Translate>Create Extractor</Translate>
            </Button>
          ) : undefined}
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

      <ExtractorModal
        isOpen={extractorModal}
        onClose={() => setExtractorModal(false)}
        onAccept={async extractor => handleSave(extractor)}
        templates={templates}
        extractor={selected.length ? selected[0].original : undefined}
      />
    </div>
  );
};

const dashboardLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const extractors = await ixAPI.get(headers);
    const templates = await templatesAPI.get(headers);
    return { extractors, templates };
  };

export { IXDashboard, dashboardLoader };
