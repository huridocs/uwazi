import React, { useMemo, useState } from 'react';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { useSetRecoilState } from 'recoil';
import * as ixAPI from 'V2/api/ix';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ClientTemplateSchema } from 'app/istore';
import { Button, ConfirmationModal, Table } from 'V2/Components/UI';
import { Translate, t } from 'app/I18N';
import { notificationAtom } from 'app/V2/atoms';
import { IXExtractorInfo } from './types';
import { Extractor, tableColumns } from './components/TableElements';

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

    return { ...extractor, templates: namedTemplates, propertyType, propertyLabel };
  });

const IXDashboard = () => {
  const { extractors, templates } = useLoaderData() as {
    extractors: IXExtractorInfo[];
    templates: ClientTemplateSchema[];
  };
  const revalidator = useRevalidator();
  const [selected, setSelected] = useState<Row<Extractor>[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);

  const formmatedExtractors = useMemo(
    () => formatExtractors(extractors, templates),
    [extractors, templates]
  );

  const deleteExtractors = async () => {
    const extractorIds = selected.map(selection => selection.original._id);

    try {
      await ixAPI.deleteExtractors(extractorIds);
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
            <Button size="small" type="button">
              <Translate>Edit Extractor</Translate>
            </Button>
          ) : undefined}

          {selected.length ? (
            <Button size="small" type="button" color="error" onClick={() => setConfirmModal(true)}>
              <Translate>Delete</Translate>
            </Button>
          ) : undefined}

          {!selected.length ? (
            <Button size="small" type="button">
              <Translate>Create Extractor</Translate>
            </Button>
          ) : undefined}
        </SettingsContent.Footer>
      </SettingsContent>

      {confirmModal && (
        <ConfirmationModal
          header="Delete extractors"
          warningText="Do you want to delete the following items?"
          // body={<ListOfItems items={selectedUsers.length ? selectedUsers : selectedGroups} />}
          body="make a list of selected extractors"
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

const dashboardLoader = (): LoaderFunction => async () => {
  const extractors = await ixAPI.get();
  const templates = await templatesAPI.get();
  return { extractors, templates };
};

export { IXDashboard, dashboardLoader };
