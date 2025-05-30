import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router';
import { Translate, I18NLink } from 'app/I18N';
import { useSetAtom } from 'jotai';
import { notificationAtom } from 'V2/atoms';
import { Table } from 'V2/Components/UI/Table/Table';
import { Button } from 'V2/Components/UI/Button';
import { TemplateRow } from './types';
import * as templatesApi from 'V2/api/templates';
import { RequestParams } from 'app/utils/RequestParams';
import { ClientTemplateSchema } from 'app/istore';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { columns } from './components/TemplatesTableComponents';
import { DeleteTemplatesConfirmationModal } from './components/DeleteTemplatesConfirmationModal';
import { ColumnDef } from '@tanstack/react-table';

const templatesLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<TemplateRow[]> =>
  async () => {
    const templates = await templatesApi.get(headers);
    const templateIds = templates.map((template: ClientTemplateSchema) => template._id);
    const entityCounts = await templatesApi.checkTemplatesEntityCount(headers, templateIds);
    // Add translation, rowId, entityCount, and disableRowSelection fields
    return templates.map((template: ClientTemplateSchema) => {
      return {
        ...template,
        rowId: template._id,
        translation: template.name,
        entityCount: entityCounts[template._id] || 0,
        disableRowSelection: template.default || entityCounts[template._id] > 0 || template.synced,
      };
    });
  };

const Templates = () => {
  const templates = useLoaderData() as TemplateRow[];
  const [selected, setSelected] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);

  const hasSyncedTemplates = templates.some(t => t.synced);

  const handleSetDefault = async (row: TemplateRow) => {
    try {
      await templatesApi.setDefault(new RequestParams({ _id: row._id }));
      setNotifications({
        type: 'success',
        text: <Translate>Default template set successfully.</Translate>,
      });
      await revalidator.revalidate();
    } catch (e) {
      setNotifications({
        type: 'error',
        text: <Translate>Error setting default template</Translate>,
      });
    }
  };

  const handleDeleteClick = async () => {
    const selectedTemplates = templates.filter(t => selected.includes(t._id));
    const counts = await templatesApi.checkTemplatesEntityCount(
      undefined,
      selected.map(id => id)
    );
    setEntityCounts(counts);
    setShowDeleteModal(true);
  };

  const handleDelete = async (templatesToDelete: TemplateRow[]) => {
    setDeleting(true);
    setShowDeleteModal(false);
    try {
      for (const template of templatesToDelete) {
        await templatesApi.remove(new RequestParams({ _id: template._id }));
      }
      setDeleting(false);
      setSelected([]);
      setNotifications({
        type: 'success',
        text: <Translate>Template(s) deleted successfully.</Translate>,
      });
      await revalidator.revalidate();
    } catch (e) {
      setDeleting(false);
      setNotifications({
        type: 'error',
        text: <Translate>Error deleting template(s)</Translate>,
      });
    }
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-templates"
    >
      <SettingsContent>
        <SettingsContent.Header title="Templates" />
        <SettingsContent.Body>
          <Table
            columns={columns(handleSetDefault, hasSyncedTemplates) as ColumnDef<TemplateRow, any>[]}
            data={templates}
            enableSelections
            onChange={({ selectedRows }) => setSelected(Object.keys(selectedRows))}
            defaultSorting={[{ id: 'name', desc: false }]}
            className="bg-white"
          />
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex justify-between w-full">
            {selected.length === 0 && (
              <I18NLink
                to="/settings/templates/new"
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg shadow hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-colors"
              >
                <Translate>Add template</Translate>
              </I18NLink>
            )}
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <Button color="error" onClick={handleDeleteClick}>
                  Delete
                </Button>
                <span className="text-gray-700">
                  <Translate>Selected</Translate> {selected.length} <Translate>of</Translate>{' '}
                  {templates.length}
                </span>
              </div>
            )}
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
      <DeleteTemplatesConfirmationModal
        open={showDeleteModal}
        onAccept={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        deleting={deleting}
        templates={templates.filter(t => selected.includes(t._id))}
      />
    </div>
  );
};

export { Templates, templatesLoader };
