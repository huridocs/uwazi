/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { useSetAtom, useAtomValue } from 'jotai';
import { Translate } from 'app/I18N';
import * as relationshipTypesAPI from 'app/V2/api/relationshiptypes';
import { Template } from 'app/apiResponseTypes';
import { notificationAtom, templatesAtom, relationshipTypesAtom } from 'app/V2/atoms';
import { Button, Table, Sidepanel, ConfirmationModal } from 'app/V2/Components/UI';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { columns, Relationships, TableRelationshipType } from './components/TableComponents';
import { Form } from './components/Form';

const relationshipTypesLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    (await relationshipTypesAPI.get(headers)).map(rel => ({ ...rel, rowId: rel._id }));

const RelationshipTypes = () => {
  const relationshipTypes = useLoaderData() as Relationships[];
  const revalidator = useRevalidator();

  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const setNotifications = useSetAtom(notificationAtom);
  const setRelationshipTypes = useSetAtom(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);

  interface formType extends Omit<Relationships, '_id'> {
    _id?: string;
  }
  const [formValues, setFormValues] = useState<formType>({} as Relationships);

  const [selectedItems, setSelectedItems] = useState<TableRelationshipType[]>([]);
  const [tableRelationshipTypes, setTableRelationshipTypes] = useState<TableRelationshipType[]>([]);

  useEffect(() => {
    setTableRelationshipTypes(
      relationshipTypes.map(relationshipType => {
        const templatesUsingIt = templates
          .map(t => {
            const usingIt = t.properties?.some(
              property => property.relationType === relationshipType._id
            );
            return usingIt ? t : null;
          })
          .filter(t => t) as Template[];

        return {
          ...relationshipType,
          rowId: relationshipType._id,
          templates: templatesUsingIt,
          disableRowSelection: Boolean(templatesUsingIt.length),
        };
      })
    );
  }, [relationshipTypes, templates]);

  const edit = (row: Row<Relationships>) => {
    setFormValues(row.original);
    setIsSidepanelOpen(true);
  };

  const add = () => {
    setFormValues({ name: '', rowId: 'NEW_REL' });
    setIsSidepanelOpen(true);
  };

  const submit = async (submitedData: Relationships) => {
    const { rowId, ...data } = submitedData;
    try {
      await relationshipTypesAPI.save(data);
      setNotifications({
        type: 'success',
        text: <Translate>Updated</Translate>,
      });
      setIsSidepanelOpen(false);
    } catch (error) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: error.error,
      });
      setIsSidepanelOpen(false);
    }
    revalidator.revalidate();
    setRelationshipTypes(relationshipTypes);
  };

  const deleteSelected = async () => {
    try {
      await relationshipTypesAPI.deleteRelationtypes(selectedItems.map(item => item._id));
      setNotifications({
        type: 'success',
        text: <Translate>Updated</Translate>,
      });
      setShowConfirmationModal(false);
    } catch (error) {
      setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: error.error,
      });
      setShowConfirmationModal(false);
    }
    revalidator.revalidate();
    setRelationshipTypes(relationshipTypes);
  };

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Relationship types" />
        <SettingsContent.Body>
          <Table
            enableSelections
            columns={columns({ edit })}
            data={tableRelationshipTypes}
            header={
              <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                Relationship types
              </Translate>
            }
            onChange={({ selectedRows }) => {
              setSelectedItems(
                tableRelationshipTypes.filter(relationship => relationship.rowId in selectedRows)
              );
            }}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className={selectedItems.length ? 'bg-primary-50' : ''}>
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setShowConfirmationModal(true)}
                color="error"
                data-testid="relationship-types-delete"
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
                <Button type="button" onClick={add} data-testid="relationship-types-add">
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
          relationtype={formValues as Relationships}
          closePanel={() => setIsSidepanelOpen(false)}
          currentTypes={relationshipTypes}
          submit={submit}
        />
      </Sidepanel>
      {showConfirmationModal && (
        <ConfirmationModal
          size="lg"
          header={<Translate>Delete</Translate>}
          warningText={<Translate>Do you want to delete the following items?</Translate>}
          body={
            <ul className="flex flex-wrap max-w-md gap-8 list-disc list-inside">
              {selectedItems.map(item => (
                <li key={item.name}>{item.name}</li>
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
