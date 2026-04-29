/* eslint-disable max-statements */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderFunction, useBlocker, useLoaderData, useRevalidator } from 'react-router';
import { IncomingHttpHeaders } from 'http';
import { RowSelectionState } from '@tanstack/react-table';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { t, Translate } from '#app/I18N/index.js';
import { useSetAtom } from 'jotai';
import { mergeClientSettings } from '#V2/atoms/mergeClientSettings.js';
import { settingsAtom } from '#V2/atoms/index.js';
import * as settingsAPI from '#V2/api/settings/index.js';
import * as templatesAPI from '#V2/api/templates/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button, Table, ConfirmNavigationModal } from '#V2/Components/UI/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import {
  createColumns,
  AddTemplatesModal,
  filterAvailableTemplates,
  createNewFilters,
  updateFilters,
  deleteFilters,
  FiltersSidepanel,
  sidepanelAtom,
  LoaderData,
  sanitizeFilters,
  formatFilters,
  Filter,
} from './components/index.js';

const filtersLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<LoaderData> =>
  async () => {
    const { filters } = await settingsAPI.get(headers);
    const templates = await templatesAPI.get(headers);
    const tableFilters: LoaderData['filters'] = formatFilters(filters || []);
    return { filters: tableFilters, templates };
  };

const FiltersTable = () => {
  const { filters: loadedFilters = [], templates: loadedTemplates } = useLoaderData() as LoaderData;
  const currentFilters = useRef(loadedFilters);
  const [hasChanges, setHasChanges] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmNavigationModal, setConfirmNavigationModal] = useState(false);
  const [showSidepanel, setShowSidepanel] = useState(false);
  const [filters, setFilters] = useState(loadedFilters);
  const [selectedFilters, setSelectedFilters] = useState<RowSelectionState>({});
  const blocker = useBlocker(hasChanges);
  const setAtom = useSetAtom(sidepanelAtom);
  const { notify } = useRequestStatus();
  const setSettings = useSetAtom(settingsAtom);
  const revalidator = useRevalidator();

  const templates = useMemo(
    () => filterAvailableTemplates(loadedTemplates, filters),
    [filters, loadedTemplates]
  );

  useEffect(() => {
    const formattedFilters = formatFilters(loadedFilters || []);
    currentFilters.current = formattedFilters;
    setFilters(formattedFilters);
  }, [loadedFilters]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setConfirmNavigationModal(true);
    }
  }, [blocker, setConfirmNavigationModal]);

  const cancel = () => {
    currentFilters.current = loadedFilters;
    setFilters(loadedFilters);
    setHasChanges(false);
  };

  const addNewFilters = (templatedIds: string[]) => {
    const newFilters = createNewFilters(templatedIds, templates);
    setFilters([...currentFilters.current, ...newFilters]);
  };

  const handleDelete = () => {
    const idsToRemove: string[] = [];
    currentFilters.current?.forEach(filter => {
      if (filter.rowId in selectedFilters) {
        idsToRemove.push(filter.rowId);
      }
      if (filter.subRows) {
        filter.subRows.forEach(subRow => {
          if (subRow.rowId in selectedFilters) {
            idsToRemove.push(subRow.rowId);
          }
        });
      }
    });

    const updatedFilters = deleteFilters(currentFilters.current, idsToRemove);
    setFilters(updatedFilters || []);
  };

  const handleSave = async () => {
    setDisabled(true);
    const filtersToSave = sanitizeFilters(currentFilters.current);
    const response = await settingsAPI.save({ filters: filtersToSave });
    if (response instanceof FetchResponseError) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        response.message || undefined
      );
      return;
    }
    setSettings(prev => mergeClientSettings(prev, response));
    setDisabled(false);
    setHasChanges(false);
    await revalidator.revalidate();
    return notify('success', t('System', 'Filters saved', null, false));
  };

  const handleSelect = ({
    rows,
    selectedRows,
  }: {
    rows: Filter[];
    selectedRows: RowSelectionState;
  }) => {
    currentFilters.current = rows;
    setSelectedFilters(selectedRows);
    if (JSON.stringify(currentFilters.current) !== JSON.stringify(loadedFilters)) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto">
      <SettingsContent>
        <SettingsContent.Header title="Filters" />
        <SettingsContent.Body>
          <div
            className="mb-4 rounded-md border p-4 shadow-md"
            style={{
              backgroundColor: 'var(--color-theme-info-banner-bg)',
              borderColor: 'var(--color-theme-info-banner-border)',
              color: 'var(--color-theme-info-banner-fg)',
            }}
          >
            <div className="flex gap-2 items-center w-full text-base font-semibold">
              <div className="w-5 h-5">
                <CheckCircleIcon />
              </div>
              <Translate>Filters configuration</Translate>
            </div>
            <div className="force-ltr">
              <Translate translationKey="Filters configuration description">
                By default, users can filter the entities in the library based on the types you have
                defined. However, you can configure how these entity types will be displayed:
              </Translate>
              <br />
              <ul className="list-disc list-inside">
                <li>
                  <Translate translationKey="Filters configuration">
                    drag and drop each entity type into the window in order to configure their order
                  </Translate>
                </li>
                <li>
                  <Translate translationKey="Filters configuration example">
                    Select &quot;Add group&quot; below to group filters under a label e.g
                    (&quot;Documents &quot;or &quot;People&quot;)
                  </Translate>
                </li>
              </ul>
            </div>
          </div>
          <Table
            dnd={{ enable: true }}
            enableSelections
            onSelect={handleSelect}
            onSort={({ rows }) => {
              setFilters(rows);
            }}
            columns={createColumns(setShowSidepanel)}
            data={filters}
            header={
              <Translate className="text-left text-base font-semibold [color:var(--color-theme-text-primary)]">
                Filters
              </Translate>
            }
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className="flex flex-wrap gap-2 w-full md:justify-between md:gap-0">
          {Object.keys(selectedFilters).length ? (
            <Button variant="danger" onClick={() => handleDelete()}>
              <Translate>Delete</Translate>
            </Button>
          ) : (
            <>
              <div className="flex gap-2 md:flex-wrap">
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  <Translate className="text-nowrap">Add entity type</Translate>
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowSidepanel(true);
                    setAtom(undefined);
                  }}
                >
                  <Translate className="text-nowrap">Add group</Translate>
                </Button>
              </div>
              <div className="flex gap-2 md:flex-wrap">
                <Button
                  variant="secondary"
                  onClick={() => cancel()}
                  disabled={!hasChanges || disabled}
                >
                  <Translate>Cancel</Translate>
                </Button>
                <Button
                  variant="success"
                  onClick={async () => handleSave()}
                  disabled={!hasChanges || disabled}
                >
                  <Translate>Save</Translate>
                </Button>
              </div>
            </>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      {showModal && (
        <AddTemplatesModal
          templates={templates}
          onCancel={() => setShowModal(false)}
          onAdd={templateIds => addNewFilters(templateIds)}
        />
      )}
      {confirmNavigationModal && (
        <ConfirmNavigationModal
          setShowModal={setConfirmNavigationModal}
          onConfirm={async () => {
            if (blocker.proceed) {
              blocker.proceed();
            }
          }}
        />
      )}
      <FiltersSidepanel
        showSidepanel={showSidepanel}
        setShowSidepanel={setShowSidepanel}
        onSave={newFilter => {
          if (newFilter) {
            setFilters(updateFilters(newFilter, filters) || []);
          }
        }}
        availableTemplates={templates}
      />
    </div>
  );
};

export { FiltersTable, filtersLoader };
