import React, { useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useNavigate, useRevalidator } from 'react-router';
import { Translate, t } from '#app/I18N/index.js';
import * as SyncAPI from '#V2/api/settings/sync.js';
import { Button, ConfirmationModal, Table } from '#V2/Components/UI/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { apiErrorToRequestError } from '#V2/shared/errorUtils.js';
import { SyncDangerWarning, SyncActivateWarning } from './components/SyncWarnings.js';
import { columns, SyncRow } from './components/TableComponents.js';
import type { SyncConfigPublic } from './types.js';

const syncListLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const [configs, error] = await SyncAPI.getSync(headers);
    if (error) throw apiErrorToRequestError(error);
    return (configs || []).map(config => ({ ...config, rowId: config.name }));
  };

const SyncList = () => {
  const rows = useLoaderData() as SyncRow[];
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { notify } = useRequestStatus();
  const [selected, setSelected] = useState<SyncRow[]>([]);
  const [toggleTarget, setToggleTarget] = useState<SyncRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const tableColumns = useMemo(
    () =>
      columns({
        onToggle: row => setToggleTarget(row.original),
      }),
    []
  );

  const persistSync = async (next: SyncConfigPublic[]) => {
    const payload = next.map(({ status: _status, ...config }) => config);
    const [, error] = await SyncAPI.saveSync(payload);
    if (error) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        error.detail ?? error.message
      );
      return false;
    }
    notify('success', t('System', 'Saved successfully.', null, false));
    await revalidator.revalidate();
    return true;
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    const next = rows.map(row =>
      row.name === toggleTarget.name ? { ...row, active: !row.active } : row
    );
    setToggleTarget(null);
    await persistSync(next);
  };

  const deleteSelected = async () => {
    const selectedNames = new Set(selected.map(item => item.name));
    const next = rows.filter(row => !selectedNames.has(row.name));
    setDeleteConfirm(false);
    setSelected([]);
    await persistSync(next);
  };

  return (
    <div className="h-full w-full overflow-y-auto" data-testid="settings-sync">
      <SettingsContent>
        <SettingsContent.Header title="Sync" />
        <SettingsContent.Body>
          <div className="mb-4">
            <SyncDangerWarning />
          </div>
          <Table
            columns={tableColumns}
            data={rows}
            enableSelections
            header={
              <Translate className="text-left text-base font-semibold text-ink">
                Sync targets
              </Translate>
            }
            onSelect={({ selectedRows }) => {
              setSelected(rows.filter(row => row.rowId in selectedRows));
            }}
            defaultSorting={[{ id: 'name', desc: false }]}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer highlighted={selected.length > 0}>
          {selected.length > 0 ? (
            <div className="flex items-center gap-2">
              <Button type="button" variant="danger" onClick={() => setDeleteConfirm(true)}>
                <Translate>Delete</Translate>
              </Button>
              <Translate>Selected</Translate> {selected.length} <Translate>of</Translate>{' '}
              {rows.length}
            </div>
          ) : (
            <Button type="button" onClick={async () => navigate('/settings/sync/new')}>
              <Translate>Add sync target</Translate>
            </Button>
          )}
        </SettingsContent.Footer>
      </SettingsContent>

      {toggleTarget && (
        <ConfirmationModal
          header={toggleTarget.active ? 'Deactivate sync' : 'Activate sync'}
          warningText={<SyncActivateWarning activating={!toggleTarget.active} />}
          body={
            <Translate>
              Are you sure you want to change the active state of this sync target?
            </Translate>
          }
          onAcceptClick={confirmToggle}
          onCancelClick={() => setToggleTarget(null)}
          dangerStyle
        />
      )}

      {deleteConfirm && (
        <ConfirmationModal
          header="Delete sync targets"
          warningText={
            <Translate>
              Deleting a sync target stops synchronization. Data already present on remote instances
              is not automatically cleaned up.
            </Translate>
          }
          body={
            <ul className="list-inside list-disc">
              {selected.map(item => (
                <li key={item.name}>{item.name}</li>
              ))}
            </ul>
          }
          onAcceptClick={deleteSelected}
          onCancelClick={() => setDeleteConfirm(false)}
          dangerStyle
        />
      )}
    </div>
  );
};

export { SyncList, syncListLoader };
