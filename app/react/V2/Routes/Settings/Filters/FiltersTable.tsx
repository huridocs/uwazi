/* eslint-disable max-statements */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderFunction, useBlocker, useLoaderData, useRevalidator } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { IncomingHttpHeaders } from 'http';
import { RowSelectionState } from '@tanstack/react-table';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { FetchResponseError } from 'shared/JSONRequest';
import { Translate } from 'app/I18N';
import { notificationAtom, settingsAtom } from 'V2/atoms';
import * as settingsAPI from 'V2/api/settings';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button, Table } from 'V2/Components/UI';
import { ConfirmNavigationModal } from 'V2/Components/Forms';
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
} from './components';

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
  const setNotifications = useSetAtom(notificationAtom);
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
      return setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        ...(response.message && { details: response.message }),
      });
    }
    setSettings(response);
    setDisabled(false);
    setHasChanges(false);
    revalidator.revalidate();
    return setNotifications({ type: 'success', text: <Translate>Filters saved</Translate> });
  };

  const handleChange = ({
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
    <div className="tw-content" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Filters" />
        <SettingsContent.Body>
          <div className="p-4 mb-4 rounded-md border border-gray-50 shadow-sm bg-primary-100 text-primary-700">
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
            onChange={handleChange}
            columns={createColumns(setShowSidepanel)}
            data={filters}
            header={
              <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                Filters
              </Translate>
            }
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className="flex flex-wrap gap-2 w-full md:justify-between md:gap-0">
          {Object.keys(selectedFilters).length ? (
            <Button styling="solid" color="error" onClick={() => handleDelete()}>
              <Translate>Delete</Translate>
            </Button>
          ) : (
            <>
              <div className="flex gap-2 md:flex-wrap">
                <Button styling="solid" color="primary" onClick={() => setShowModal(true)}>
                  <Translate className="text-nowrap">Add entity type</Translate>
                </Button>
                <Button
                  styling="solid"
                  color="primary"
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
                  styling="outline"
                  color="primary"
                  onClick={() => cancel()}
                  disabled={!hasChanges || disabled}
                >
                  <Translate>Cancel</Translate>
                </Button>
                <Button
                  styling="solid"
                  color="success"
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
