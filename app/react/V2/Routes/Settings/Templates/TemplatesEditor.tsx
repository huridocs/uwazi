/* eslint-disable max-lines */
/* eslint-disable max-statements */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Table, ConfirmNavigationModal, ConfirmationModal } from 'V2/Components/UI';
import { Translate } from 'app/I18N/Translate';
import { IncomingHttpHeaders } from 'http';
import {
  LoaderFunction,
  useLoaderData,
  useNavigate,
  useBlocker,
  useRevalidator,
} from 'react-router';
import * as templatesAPI from 'V2/api/templates';
import * as pagesAPI from 'V2/api/pages';
import { PropertySchema } from 'shared/types/commonTypes';
import { Page, ClientTemplateSchema } from 'V2/shared/types';
import { isEqual } from 'lodash';
import { useSetAtom, useAtomValue } from 'jotai';
import { notificationAtom, templatesAtom } from 'V2/atoms';
import uniqueID from 'shared/uniqueID';
import {
  cleanProperty,
  emptyTemplate,
  processDefaultProperties,
  processProperties,
  confirmationMessages,
} from './helpers';
import { propertyColumns, PropertyRow } from './components/TemplateEditorTableComponents';
import { TemplateMetadata } from './components/TemplateMetadata';
import { AddRelationshipTypeModal } from './components/AddRelationshipTypeModal';
import { AddThesaurusModal } from './components/AddThesaurusModal';
import { TemplatesEditorFooter } from './components/TemplatesEditorFooter';
import { ConfigPropertyPanel } from './components/ConfigPropertyPanel';

const templatesEditorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    const allPages = await pagesAPI.get(headers);
    const pages = allPages.filter((page: any) => page.entityView);
    const pagesOptions = pages.map((page: Page) => ({
      value: page.sharedId,
      label: page.title,
    }));
    let loadedTemplate = emptyTemplate;
    const templates = await templatesAPI.get(headers);

    if (params.templateId) {
      const templateToEdit = templates.find(template => template._id === params.templateId);
      if (templateToEdit) {
        loadedTemplate = templateToEdit as ClientTemplateSchema;
      }
    }

    return { loadedTemplate, pagesOptions };
  };

const TemplatesEditor = () => {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { loadedTemplate, pagesOptions } = useLoaderData() as {
    loadedTemplate: ClientTemplateSchema;
    pagesOptions: { value: string; label: string }[];
  };
  const [template, setTemplate] = useState<ClientTemplateSchema>(loadedTemplate);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [commonProperties, setCommonProperties] = useState<PropertyRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const setNotifications = useSetAtom(notificationAtom);
  const setTemplates = useSetAtom(templatesAtom);
  const templates = useAtomValue(templatesAtom);
  const [nameError, setNameError] = useState(false);
  const [colorError, setColorError] = useState(false);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [showRelationshipTypeModal, setShowRelationshipTypeModal] = useState(false);
  const [showThesaurusModal, setShowThesaurusModal] = useState(false);
  const [showConfigPropertyPanel, setShowConfigPropertyPanel] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<PropertyRow | undefined>();
  const [showReindexModal, setShowReindexModal] = useState(false);
  const [showLargeEntityCountModal, setShowLargeEntityCountModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const ENTITY_COUNT_THRESHOLD = 3000;

  useEffect(() => {
    setProperties(processProperties(loadedTemplate.properties || []));
  }, [loadedTemplate.properties]);

  useEffect(() => {
    setCommonProperties(processDefaultProperties(loadedTemplate.commonProperties || []));
  }, [loadedTemplate.commonProperties]);

  useEffect(() => {
    setTemplate(loadedTemplate);
  }, [loadedTemplate]);

  const getCurrentStatus = useCallback((): ClientTemplateSchema => {
    const cleanedCommonProperties = commonProperties.map(cleanProperty);
    const cleanedProperties = properties.map(cleanProperty);

    return {
      ...template,
      commonProperties: cleanedCommonProperties as [PropertySchema, ...PropertySchema[]],
      properties: cleanedProperties,
    };
  }, [template, commonProperties, properties]);

  const checkPendingChanges = useCallback(
    () => !isEqual(loadedTemplate, getCurrentStatus()),
    [getCurrentStatus, loadedTemplate]
  );

  const blocker = useBlocker(
    ({ nextLocation }) =>
      !nextLocation?.pathname.includes('templates/edit') && checkPendingChanges()
  );

  useMemo(() => {
    if (blocker.state === 'blocked') {
      setShowNavigationModal(true);
    }
  }, [blocker, setShowNavigationModal]);

  const allProperties = useMemo(
    () => [...commonProperties, ...properties],
    [commonProperties, properties]
  );

  const handleTableChange = ({
    selectedRows,
    rows,
  }: {
    selectedRows: Record<string, boolean>;
    rows: PropertyRow[];
  }) => {
    setSelected(rows.filter(row => selectedRows[row.rowId]).map(row => row.rowId));
    const newCommonProperties = rows.filter(row => row.isCommonProperty);
    const newProperties = rows.filter(row => !row.isCommonProperty);
    if (!isEqual(newCommonProperties, commonProperties)) {
      setCommonProperties(newCommonProperties);
    }
    if (!isEqual(newProperties, properties)) {
      setProperties(newProperties);
    }
  };

  const save = async (forceReindex = false) => {
    const templateToSave = getCurrentStatus();

    if (forceReindex) {
      templateToSave.reindex = true;
    }

    const savedTemplate = await templatesAPI.save(templateToSave);
    await revalidator.revalidate();

    // Update templates atom
    const updatedTemplates = template._id
      ? templates.map(t => (t._id === template._id ? savedTemplate : t))
      : [...templates, savedTemplate];
    setTemplates(updatedTemplates);
    setNotifications({
      type: 'success',
      text: <Translate>Template saved successfully.</Translate>,
    });

    await navigate(`/settings/templates/edit/${savedTemplate._id}`);
  };

  const handlePropertySave = (propertyConfig: PropertySchema) => {
    if (propertyToEdit && propertyConfig.isCommonProperty) {
      setCommonProperties(current =>
        current.map(p => (p.rowId === propertyToEdit.rowId ? { ...p, ...propertyConfig } : p))
      );
      return;
    }

    if (propertyToEdit) {
      setProperties(current =>
        current.map(p => (p.rowId === propertyToEdit.rowId ? { ...p, ...propertyConfig } : p))
      );
      return;
    }

    setProperties(current => [...current, { ...propertyConfig, rowId: uniqueID() }]);
  };

  const handleSave = async (ignoreEntityCount = false) => {
    const isDuplicateName = templates.some(
      t => t.name.toLowerCase() === template.name.toLowerCase() && t._id !== template._id
    );
    setNameError(!template.name || isDuplicateName);
    if (!template.name || isDuplicateName) {
      return;
    }

    if (template._id) {
      const entityCounts = await templatesAPI.checkTemplatesEntityCount(undefined, [template._id]);
      const entityCount = entityCounts[template._id] || 0;

      if (entityCount > ENTITY_COUNT_THRESHOLD && !ignoreEntityCount) {
        setShowLargeEntityCountModal(true);
        return;
      }
    }

    try {
      setIsSaving(true);
      await save();
    } catch (e) {
      if (e.status === 409) {
        setShowReindexModal(true);
        return;
      }
      setNotifications({ type: 'error', text: <Translate>Error saving template.</Translate> });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setProperties(current => current.filter(row => !selected.includes(row.rowId)));
  };

  const handleEditProperty = (property: PropertyRow) => {
    setPropertyToEdit(property);
    setShowConfigPropertyPanel(true);
  };

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header
          title={template.name}
          path={new Map([['Templates', '/settings/templates']])}
        />
        <SettingsContent.Body>
          <Table
            columns={propertyColumns(handleEditProperty)}
            data={allProperties}
            enableSelections
            dnd={{ enable: true }}
            onChange={handleTableChange}
            header={
              <TemplateMetadata
                value={{
                  name: template.name,
                  color: template.color || '#C03B22',
                  entityViewPage: template.entityViewPage || '',
                }}
                onChange={values => {
                  setTemplate({ ...template, ...values });
                  if (values.name) setNameError(false);
                  if (values.color) setColorError(false);
                }}
                pages={pagesOptions}
                nameError={nameError}
                colorError={colorError}
              />
            }
          />
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <TemplatesEditorFooter
            selected={selected}
            onDelete={handleDelete}
            onSave={handleSave}
            onAddThesaurus={() => setShowThesaurusModal(true)}
            onAddRelationshipType={() => setShowRelationshipTypeModal(true)}
            onAddProperty={() => setShowConfigPropertyPanel(true)}
            disableSave={!checkPendingChanges() || isSaving}
          />
        </SettingsContent.Footer>
      </SettingsContent>
      {showNavigationModal && (
        <ConfirmNavigationModal setShowModal={setShowNavigationModal} onConfirm={blocker.proceed} />
      )}
      {showRelationshipTypeModal && (
        <AddRelationshipTypeModal onClose={() => setShowRelationshipTypeModal(false)} />
      )}
      {showThesaurusModal && <AddThesaurusModal onClose={() => setShowThesaurusModal(false)} />}

      <ConfigPropertyPanel
        isOpen={showConfigPropertyPanel}
        onSubmit={handlePropertySave}
        onClose={() => {
          setShowConfigPropertyPanel(false);
          setPropertyToEdit(undefined);
        }}
        template={{ ...template, properties, commonProperties } as ClientTemplateSchema}
        propertyToEdit={propertyToEdit}
      />
      {showLargeEntityCountModal && (
        <ConfirmationModal
          size="lg"
          header={confirmationMessages.largeNumberOfEntities.title}
          body={
            <Translate translationKey={confirmationMessages.largeNumberOfEntities.key}>
              {confirmationMessages.largeNumberOfEntities.text}
            </Translate>
          }
          onAcceptClick={async () => {
            setShowLargeEntityCountModal(false);
            await handleSave(true);
          }}
          onCancelClick={() => setShowLargeEntityCountModal(false)}
          acceptButton={<Translate>Continue</Translate>}
          cancelButton={<Translate>Cancel</Translate>}
          dangerStyle
        />
      )}
      {showReindexModal && (
        <ConfirmationModal
          size="lg"
          header={confirmationMessages.templateConflict.title}
          body={
            <Translate translationKey={confirmationMessages.templateConflict.key}>
              {confirmationMessages.templateConflict.text}
            </Translate>
          }
          onAcceptClick={async () => {
            setShowReindexModal(false);
            try {
              setIsSaving(true);
              await save(true);
            } catch (e) {
              if (e.status === 409) {
                setShowReindexModal(true);
                return;
              }
              setNotifications({
                type: 'error',
                text: <Translate>Error saving template.</Translate>,
              });
            } finally {
              setIsSaving(false);
            }
          }}
          onCancelClick={() => setShowReindexModal(false)}
          acceptButton={<Translate>Continue</Translate>}
          cancelButton={<Translate>Cancel</Translate>}
          dangerStyle
        />
      )}
    </div>
  );
};

export { TemplatesEditor, templatesEditorLoader };
