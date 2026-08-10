import React, { useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { Translate, I18NLinkV2 as I18NLink, t } from '#app/I18N/index.js';
import { Table } from '#V2/Components/UI/Table/Table.js';
import { Button } from '#V2/Components/UI/Button.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { ColumnDef } from '@tanstack/react-table';
import { useServices } from '#V2/services/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { columns } from './components/TemplatesTableComponents.js';
import { DeleteTemplatesConfirmationModal } from './components/DeleteTemplatesConfirmationModal.js';
import { TemplateRow } from './types.js';

const Templates = () => {
  const templates = useLoaderData() as TemplateRow[];
  const [selectedItems, setSelectedItems] = useState<TemplateRow[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const revalidator = useRevalidator();
  const { notify } = useRequestStatus();
  const { templates: templatesService } = useServices();

  const hasSyncedTemplates = templates.some(template => template.synced);

  const handleSetDefault = async (row: TemplateRow) => {
    const [, error] = await templatesService.setDefault(row._id!);

    if (error) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        error.detail ?? error.message
      );
      return;
    }

    notify('success', t('System', 'Default template set successfully.', null, false));
    await revalidator.revalidate();
  };

  const handleDeleteClick = async () => {
    setShowDeleteModal(true);
  };

  const handleDelete = async (templatesToDelete: TemplateRow[]) => {
    setShowDeleteModal(false);
    const ids = templatesToDelete
      .map(template => template._id)
      .filter((id): id is string => Boolean(id));
    const [, error] = await templatesService.delete(ids);

    if (error) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        error.detail ?? error.message
      );
      return;
    }

    setSelectedItems([]);
    notify('success', t('System', 'Template(s) deleted successfully.', null, false));
    await revalidator.revalidate();
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
            onSelect={({ selectedRows }) => {
              setSelectedItems(templates.filter(template => template.rowId in selectedRows));
            }}
            defaultSorting={[{ id: 'name', desc: false }]}
            className="bg-paper"
          />
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex justify-between w-full">
            {selectedItems.length === 0 && (
              <I18NLink to="/settings/templates/new">
                <Button variant="primary">
                  <Translate>Add template</Translate>
                </Button>
              </I18NLink>
            )}
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="danger" onClick={handleDeleteClick} data-testid="templates-delete">
                  <Translate>Delete</Translate>
                </Button>
                <span className="text-ink-secondary">
                  <Translate>Selected</Translate> {selectedItems.length} <Translate>of</Translate>{' '}
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
        templates={selectedItems}
      />
    </div>
  );
};

export { Templates };
