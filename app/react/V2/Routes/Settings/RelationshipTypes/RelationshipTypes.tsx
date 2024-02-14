/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useMemo } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator, useBlocker } from 'react-router-dom';

import { Row } from '@tanstack/react-table';
import { useSetRecoilState } from 'recoil';

import { Translate } from 'app/I18N';
import { isEqual } from 'lodash';
import * as relationshipTypesAPI from 'app/V2/api/relationshiptypes';
import { ConfirmNavigationModal } from 'app/V2/Components/Forms';

import { notificationAtom } from 'app/V2/atoms';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { Button, Table, Sidepanel } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';

import { columns } from './components/TableComponents';
import { ClientRelationshipType } from 'app/apiResponseTypes';

const relationshipTypesLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    relationshipTypesAPI.get(headers);

const RelationshipTypes = () => {
  const relationshipTypes = useLoaderData() as ClientRelationshipType[];
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);
  const revalidator = useRevalidator();

  const [selectedItems, setSelectedItems] = useState<Row<ClientRelationshipType>[]>([]);
  const [changes, setChanges] = useState<ClientRelationshipType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const setSettings = useSetRecoilState(settingsAtom);

  const blocker = useBlocker(!isEqual(relationshipTypes, changes));

  useMemo(() => {
    if (blocker.state === 'blocked') {
      setShowModal(true);
    }
  }, [blocker, setShowModal]);

  const edit = (row: Row<ClientRelationshipType>) => {
    //const data = row.original;
    setIsSidepanelOpen(true);
  };

  const add = () => {
    setIsSidepanelOpen(true);
  };

  const save = async () => {
    await relationshipTypesAPI.save(changes);
    revalidator.revalidate();
    setNotifications({
      type: 'success',
      text: <Translate>Updated</Translate>,
    });
  };

  const deleteSelected = async () => {
    setChanges();
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-account"
    >
      <SettingsContent>
        <SettingsContent.Header title="Menu" />
        <SettingsContent.Body>
          <Table<ClientRelationshipType>
            enableSelection
            draggableRows
            columns={columns({ edit })}
            data={changes}
            onChange={setChanges}
            title={<Translate>Menu</Translate>}
            onSelection={setSelectedItems}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className={selectedItems.length ? 'bg-primary-50' : ''}>
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={deleteSelected}
                color="error"
                data-testid="menu-delete-link"
              >
                <Translate>Delete</Translate>
              </Button>
              <Translate>Selected</Translate> {selectedItems.length} <Translate>of</Translate>{' '}
            </div>
          )}
          {selectedItems.length === 0 && (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button type="button" onClick={add} data-testid="menu-add-link">
                  <Translate>Add relationship type</Translate>
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={save}
                  color="success"
                  disabled={relationshipTypes === changes}
                  data-testid="menu-save"
                >
                  <Translate>Save</Translate>
                </Button>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <Sidepanel
        title={
          <Translate className="uppercase">
            {`${formValues?.name === '' ? 'Add' : 'Edit'} relationship type`}
          </Translate>
        }
        isOpen={isSidepanelOpen}
        closeSidepanelFunction={() => setIsSidepanelOpen(false)}
        size="large"
        withOverlay
      >
        Some content
      </Sidepanel>
      {showModal && (
        <ConfirmNavigationModal setShowModal={setShowModal} onConfirm={blocker.proceed} />
      )}
    </div>
  );
};

export { RelationshipTypes, relationshipTypesLoader };
