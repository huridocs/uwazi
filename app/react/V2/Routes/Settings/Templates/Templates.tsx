import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router';
import { Translate, I18NLinkV2 as I18NLink, t } from 'app/I18N';
import { useSetAtom } from 'jotai';
import { notificationAtom } from 'V2/atoms';
import { Table } from 'V2/Components/UI/Table/Table';
import { Button } from 'V2/Components/UI/Button';
import * as templatesApi from 'V2/api/templates';
import { RequestParams } from 'app/utils/RequestParams';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { ColumnDef } from '@tanstack/react-table';
import { Template } from 'app/apiResponseTypes';
import { columns } from './components/TemplatesTableComponents';
import { DeleteTemplatesConfirmationModal } from './components/DeleteTemplatesConfirmationModal';
import { TemplateRow } from './types';

const templatesLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<TemplateRow[]> =>
  async () => {
    const templates = await templatesApi.get(headers);
    const templateIds = templates.map((template: Template) => template._id);
    const entityCounts = await templatesApi.checkTemplatesEntityCount(headers, templateIds);
    return templates.map((template: Template) => {
      const reasons = [];
      if (template.default) {
        reasons.push(t('System', 'A default template cannot be deleted.', null, false));
      }
      if (entityCounts[template._id] > 0) {
        reasons.push(
          t(
            'System',
            'This template is in use by existing entities and cannot be deleted.',
            null,
            false
          )
        );
      }
      if (template.synced) {
        reasons.push(t('System', 'Synced templates cannot be deleted.', null, false));
      }

      const disableRowSelection = reasons.length > 0 ? reasons.join(' ') : undefined;

      return {
        ...template,
        rowId: template._id,
        translation: template.name,
        entityCount: entityCounts[template._id] || 0,
        disableRowSelection,
      };
    });
  };

const Templates = () => {
  const templates = useLoaderData() as TemplateRow[];
  const [selected, setSelected] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);

  const hasSyncedTemplates = templates.some(template => template.synced);

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
    setShowDeleteModal(true);
  };

  const handleDelete = async (templatesToDelete: TemplateRow[]) => {
    setShowDeleteModal(false);
    try {
      await Promise.all(
        templatesToDelete.map(async template =>
          templatesApi.remove(new RequestParams({ _id: template._id }))
        )
      );
      setSelected([]);
      setNotifications({
        type: 'success',
        text: <Translate>Template(s) deleted successfully.</Translate>,
      });
      await revalidator.revalidate();
    } catch (e) {
      setNotifications({
        type: 'error',
        text: <Translate>Error deleting template(s)</Translate>,
      });
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto" data-testid="settings-templates">
      <SettingsContent>
        <SettingsContent.Header title="Templates" />
        <SettingsContent.Body>
          <Table
            columns={columns(handleSetDefault, hasSyncedTemplates) as ColumnDef<TemplateRow, any>[]}
            data={templates}
            enableSelections
            onSelect={({ selectedRows }) => setSelected(Object.keys(selectedRows))}
            defaultSorting={[{ id: 'name', desc: false }]}
            className="bg-white"
          />
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex justify-between w-full">
            {selected.length === 0 && (
              <I18NLink to="/settings/templates/new">
                <Button color="primary">
                  <Translate>Add template</Translate>
                </Button>
              </I18NLink>
            )}
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <Button color="error" onClick={handleDeleteClick}>
                  <Translate>Delete</Translate>
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
        templates={templates.filter(template => selected.includes(template._id))}
      />
    </div>
  );
};

export { Templates, templatesLoader };
