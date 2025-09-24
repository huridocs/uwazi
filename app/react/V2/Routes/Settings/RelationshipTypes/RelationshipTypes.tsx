/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData, useRevalidator } from 'react-router';
import { Row } from '@tanstack/react-table';
import { useSetAtom, useAtomValue } from 'jotai';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { t, Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../api/V2/api/relationshipt... Remove this comment to see the full error message
import * as relationshipTypesAPI from 'api/V2/api/relationshiptypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { Template } from '../../apiResponseTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/atoms.js' or its corr... Remove this comment to see the full error message
import { notificationAtom, templatesAtom, relationshipTypesAtom } from '../../V2/atoms.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button, Table, Sidepanel, ConfirmationModal } from '../../V2/Components/UI.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Layouts/Se... Remove this comment to see the full error message
import { SettingsContent } from '../../V2/Components/Layouts/SettingsContent.js';
import { columns, Relationships, TableRelationshipType } from './components/TableComponents';
import { Form } from './components/Form';

const relationshipTypesLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () =>
    // @ts-expect-error TS(7006): Parameter 'rel' implicitly has an 'any' type.
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
      relationshipTypes
        .map(relationshipType => {
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          const templatesUsingIt = templates
            // @ts-expect-error TS(7006): Parameter 'tmpl' implicitly has an 'any' type.
            .map(tmpl => {
              const usingIt = tmpl.properties?.some(
                // @ts-expect-error TS(7006): Parameter 'property' implicitly has an 'any' type.
                property => property.relationType === relationshipType._id
              );
              return usingIt ? tmpl : null;
            })
            // @ts-expect-error TS(7006): Parameter 'tmpl' implicitly has an 'any' type.
            .filter(tmpl => tmpl) as Template[];

          return {
            ...relationshipType,
            rowId: relationshipType._id,
            translation: t(relationshipType._id, relationshipType.name, null, false),
            templates: templatesUsingIt,
            disableRowSelection: Boolean(templatesUsingIt.length),
          };
        })
        .sort((a, b) => a.translation.localeCompare(b.translation))
    );
  }, [relationshipTypes, templates]);

  useEffect(() => {
    setRelationshipTypes(relationshipTypes);
  }, [relationshipTypes, setRelationshipTypes]);

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
    await revalidator.revalidate();
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
    await revalidator.revalidate();
  };

  return (
    <div className="w-full h-full overflow-y-auto">
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
            // @ts-expect-error TS(7031): Binding element 'selectedRows' implicitly has an '... Remove this comment to see the full error message
            onSelect={({ selectedRows }) => {
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
