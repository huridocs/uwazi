import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router';
import { Translate, I18NLinkV2 as I18NLink, t } from '#app/I18N/index.js';
import { Table } from '#V2/Components/UI/Table/Table.js';
import { Button } from '#V2/Components/UI/Button.js';
import * as templatesApi from '#V2/api/templates/index.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { ColumnDef } from '@tanstack/react-table';
import { Template } from '#app/apiResponseTypes.js';
import { handleUnexpectedError } from '#app/V2/shared/errorUtils.js';
import { columns } from './components/TemplatesTableComponents.js';
import { DeleteTemplatesConfirmationModal } from './components/DeleteTemplatesConfirmationModal.js';
import { TemplateRow } from './types.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

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
  const { notify } = useRequestStatus();

  const hasSyncedTemplates = templates.some(template => template.synced);

  const handleSetDefault = async (row: TemplateRow) => {
    try {
      await templatesApi.setDefault(new RequestParams({ _id: row._id }));
      notify('success', t('System', 'Default template set successfully.', null, false));
      await revalidator.revalidate();
    } catch (e) {
      handleUnexpectedError(e, 'Error setting default template');
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
      notify('success', t('System', 'Template(s) deleted successfully.', null, false));
      await revalidator.revalidate();
    } catch (e) {
      handleUnexpectedError(e, 'Error deleting template(s)');
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
            className="bg-paper"
          />
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex justify-between w-full">
            {selected.length === 0 && (
              <I18NLink to="/settings/templates/new">
                <Button variant="primary">
                  <Translate>Add template</Translate>
                </Button>
              </I18NLink>
            )}
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="danger" onClick={handleDeleteClick}>
                  <Translate>Delete</Translate>
                </Button>
                <span className="text-ink-secondary">
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
