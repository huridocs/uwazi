/* eslint-disable max-statements */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Table, Button, ConfirmNavigationModal } from 'V2/Components/UI';
import { Translate } from 'app/I18N/Translate';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useNavigate, useBlocker, Location } from 'react-router';
import * as templatesAPI from 'V2/api/templates';
import * as pagesAPI from 'V2/api/pages';
import { PropertySchema } from 'shared/types/commonTypes';
import { Page, ClientTemplateSchema } from 'V2/shared/types';
import { isEqual } from 'lodash';
import { useSetAtom, useAtomValue } from 'jotai';
import { notificationAtom, templatesAtom } from 'V2/atoms';
import { I18NLink } from 'app/I18N';
import {
  cleanProperty,
  emptyTemplate,
  processDefaultProperties,
  processProperties,
} from './helpers';
import { propertyColumns, PropertyRow } from './components/TemplateEditorTableComponents';
import { TemplateMetadata } from './components/TemplateMetadata';
import { AddRelationshipTypeModal } from './components/AddRelationshipTypeModal';
import { AddThesaurusModal } from './components/AddThesaurusModal';

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
        loadedTemplate = templateToEdit;
      }
    }

    return { loadedTemplate, pagesOptions };
  };

const TemplatesEditor = () => {
  const navigate = useNavigate();
  const loadedData = useLoaderData() as {
    loadedTemplate: ClientTemplateSchema;
    pagesOptions: { value: string; label: string }[];
  };

  const { loadedTemplate, pagesOptions } = loadedData;
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
    (nextLocation?: Location<any> | undefined) =>
      !nextLocation?.pathname.includes('edit') && !isEqual(loadedTemplate, getCurrentStatus()),
    [getCurrentStatus, loadedTemplate]
  );

  const blocker = useBlocker(({ nextLocation }) => checkPendingChanges(nextLocation));

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

  const handleSave = async () => {
    const isDuplicateName = templates.some(
      t => t.name.toLowerCase() === template.name.toLowerCase() && t._id !== template._id
    );
    setNameError(!template.name || isDuplicateName);
    setColorError(!template.color);
    if (!template.name || !template.color || isDuplicateName) {
      return;
    }

    try {
      const templateToSave = getCurrentStatus();
      const savedTemplate = await templatesAPI.save(templateToSave);
      setTemplate(savedTemplate);

      // Update templates atom
      const updatedTemplates = template._id
        ? templates.map(t => (t._id === template._id ? savedTemplate : t))
        : [...templates, savedTemplate];
      setTemplates(updatedTemplates);
      setNotifications({
        type: 'success',
        text: <Translate>Template saved successfully.</Translate>,
      });
      await navigate('/settings/templates');
    } catch (e) {
      if (e.status === 409) {
        //TODO: show confirmation modal to reindex the entities with the new template
        return;
      }
      setNotifications({ type: 'error', text: <Translate>Error saving template.</Translate> });
    }
  };

  const handleDelete = () => {
    setProperties(current => current.filter(row => !selected.includes(row.rowId)));
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
            columns={propertyColumns}
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
          <div className="flex justify-between w-full">
            <div className="flex gap-2 items-center">
              {selected.length === 0 ? (
                <>
                  <Button color="primary">
                    <Translate>Add property</Translate>
                  </Button>
                  <Button
                    color="primary"
                    styling="outline"
                    onClick={() => setShowThesaurusModal(true)}
                  >
                    <Translate>Add thesaurus</Translate>
                  </Button>
                  <Button
                    color="primary"
                    styling="outline"
                    onClick={() => setShowRelationshipTypeModal(true)}
                  >
                    <Translate>Add relationship type</Translate>
                  </Button>
                </>
              ) : (
                <>
                  <Button color="error" onClick={handleDelete}>
                    <Translate>Remove</Translate>
                  </Button>
                  <span className="text-gray-700">
                    <Translate>Selected</Translate> {selected.length}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <I18NLink to="/settings/templates">
                <Button styling="outline">
                  <Translate>Cancel</Translate>
                </Button>
              </I18NLink>
              <Button color="success" onClick={handleSave}>
                <Translate>Save</Translate>
              </Button>
            </div>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
      {showNavigationModal && (
        <ConfirmNavigationModal setShowModal={setShowNavigationModal} onConfirm={blocker.proceed} />
      )}
      {showRelationshipTypeModal && (
        <AddRelationshipTypeModal
          isOpen={showRelationshipTypeModal}
          onClose={() => setShowRelationshipTypeModal(false)}
        />
      )}
      {showThesaurusModal && (
        <AddThesaurusModal
          isOpen={showThesaurusModal}
          onClose={() => setShowThesaurusModal(false)}
        />
      )}
    </div>
  );
};

export { TemplatesEditor, templatesEditorLoader };
