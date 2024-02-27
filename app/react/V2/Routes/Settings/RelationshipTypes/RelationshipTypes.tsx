/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';

import { Row } from '@tanstack/react-table';
import { useSetRecoilState } from 'recoil';

import { Translate } from 'app/I18N';
import * as relationshipTypesAPI from 'app/V2/api/relationshiptypes';

import { notificationAtom } from 'app/V2/atoms';
import { settingsAtom } from 'app/V2/atoms/settingsAtom';
import { Button, Table, Sidepanel, ConfirmationModal } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';

import { columns } from './components/TableComponents';
import { Form } from './components/Form';
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
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const setSettings = useSetRecoilState(settingsAtom);

  interface formType extends Omit<ClientRelationshipType, '_id'> {
    _id?: string;
  }
  const [formValues, setFormValues] = useState<formType>({} as ClientRelationshipType);

  const edit = (row: Row<ClientRelationshipType>) => {
    setFormValues(row.original);
    setIsSidepanelOpen(true);
  };

  const add = () => {
    setFormValues({ name: '' });
    setIsSidepanelOpen(true);
  };

  const submit = async (submitedData: ClientRelationshipType) => {
    try {
      await relationshipTypesAPI.save(submitedData);
      setNotifications({
        type: 'success',
        text: <Translate>Updated</Translate>,
      });
      setIsSidepanelOpen(false);
    } catch (error) {
      console.log('error', error); // eslint-disable-line no-console
      setNotifications({
        type: 'error',
        text: <Translate>Failed to save</Translate>,
      });
      setIsSidepanelOpen(false);
    }
    revalidator.revalidate();
  };

  const deleteSelected = async () => {
    try {
      await relationshipTypesAPI.deleteRelationtypes(selectedItems.map(item => item.original._id));
      setNotifications({
        type: 'success',
        text: <Translate>Updated</Translate>,
      });
      setShowConfirmationModal(false);
    } catch (error) {
      console.log('error', error); // eslint-disable-line no-console
      setNotifications({
        type: 'error',
        text: <Translate>Failed to save</Translate>,
      });
      setShowConfirmationModal(false);
    }
    revalidator.revalidate();
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-account"
    >
      <SettingsContent>
        <SettingsContent.Header title="Relationship types" />
        <SettingsContent.Body>
          <Table<ClientRelationshipType>
            enableSelection
            columns={columns({ edit })}
            data={relationshipTypes}
            title={<Translate>Relationship types</Translate>}
            onSelection={setSelectedItems}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className={selectedItems.length ? 'bg-primary-50' : ''}>
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setShowConfirmationModal(true)}
                color="error"
                data-testid="relationship-types-delete-link"
              >
                <Translate>Delete</Translate>
              </Button>
              <Translate>Selected</Translate> {selectedItems.length} <Translate>of</Translate>
              {relationshipTypes.length}
            </div>
          )}
          {selectedItems.length === 0 && (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button type="button" onClick={add} data-testid="relationship-types-add-link">
                  <Translate>Add relationship type</Translate>
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
        size="medium"
        withOverlay
      >
        <Form
          relationtype={formValues as ClientRelationshipType}
          closePanel={() => setIsSidepanelOpen(false)}
          currentTypes={relationshipTypes}
          submit={submit}
        />
      </Sidepanel>
      {showConfirmationModal && (
        <ConfirmationModal
          size="lg"
          header={<Translate>Delete</Translate>}
          warningText={<Translate>Do you want to delete?</Translate>}
          body={
            <ul className="flex flex-wrap max-w-md gap-8 list-disc list-inside">
              {selectedItems.map(item => (
                <li key={item.original.name}>{item.original.name}</li>
              ))}
            </ul>
          }
          onAcceptClick={deleteSelected}
          onCancelClick={() => setShowConfirmationModal(false)}
          dangerStyle
        />
      )}
    </div>
  );
};

export { RelationshipTypes, relationshipTypesLoader };
