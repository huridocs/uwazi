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
import { relationshipTypesAtom } from 'app/V2/atoms/relationshipTypes';
import { Button, Table, Sidepanel, ConfirmationModal } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Modal } from 'app/V2/Components/UI/Modal';

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
  const setRelationshipTypes = useSetRecoilState(relationshipTypesAtom);
  const revalidator = useRevalidator();
  const [relationshipTypesBeingUsed, setRelationshipTypesBeingUsed] = useState<string[]>([]);

  const [selectedItems, setSelectedItems] = useState<Row<ClientRelationshipType>[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showCantDeleteModal, setShowCantDeleteModal] = useState(false);

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
      setNotifications({
        type: 'error',
        text: <Translate>Failed to save</Translate>,
        details: error.error,
      });
      setIsSidepanelOpen(false);
    }
    revalidator.revalidate();
    setRelationshipTypes(relationshipTypes);
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
      setNotifications({
        type: 'error',
        text: <Translate>Failed to save</Translate>,
        details: error.error,
      });
      setShowConfirmationModal(false);
    }
    revalidator.revalidate();
    setRelationshipTypes(relationshipTypes);
  };

  const checkDelete = async () => {
    const checks = await Promise.all(
      selectedItems.map(async relationshipType => {
        const uses = await relationshipTypesAPI.relationshipTypeBeingUsed(
          relationshipType.original._id
        );

        return { ...relationshipType.original, beingUsed: uses > 0 };
      })
    );

    setRelationshipTypesBeingUsed(checks.filter(r => r.beingUsed).map(r => r.name));

    if (checks.some(r => r.beingUsed)) {
      setShowCantDeleteModal(true);
      return;
    }

    setShowConfirmationModal(true);
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
                onClick={checkDelete}
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
      {showCantDeleteModal && (
        <Modal size="lg" data-testid="cant-delete-modal">
          <Modal.Header className="border-b-0">
            <>
              <h2 className="text-xl font-medium text-gray-900">
                <Translate>This relationship type is being used and cannot be deleted.</Translate>
              </h2>
              <Modal.CloseButton onClick={() => setShowCantDeleteModal(false)} />
            </>
          </Modal.Header>
          <Modal.Body>
            <ul className="flex flex-wrap max-w-md gap-8 list-disc list-inside">
              {relationshipTypesBeingUsed.map(name => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={() => setShowCantDeleteModal(false)}
              color="error"
              className="grow"
              data-testid="accept-button"
            >
              <Translate>Accept</Translate>
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export { RelationshipTypes, relationshipTypesLoader };
