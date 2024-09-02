/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useMemo, useState } from 'react';
import { Location, useBlocker, useLoaderData, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAtomValue, useSetAtom } from 'jotai';
import { Row } from '@tanstack/react-table';
import { isEmpty } from 'lodash';
import { Translate } from 'app/I18N';
import { ClientThesaurus } from 'app/apiResponseTypes';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button } from 'V2/Components/UI';
import { ConfirmNavigationModal } from 'V2/Components/Forms';
import { notificationAtom, templatesAtom } from 'app/V2/atoms';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { PropertySchema } from 'shared/types/commonTypes';
import {
  addGroupSubmit,
  addItemSubmit,
  compareThesaurus,
  emptyThesaurus,
  removeItem,
  sanitizeThesaurusValues,
  sortValues,
  thesaurusAsRow,
} from './helpers';
import type { ConfirmationCallback } from './helpers';
import { DeletionModal, GroupForm, ThesaurusValueForm, ThesaurusActions } from './components';
import type { ThesaurusRow } from './components';
import { ThesaurusForm } from './ThesaurusForm';
import { ImportButton } from './components/ImportButton';

const EditThesaurus = () => {
  const navigate = useNavigate();
  const thesaurus = useLoaderData() as ClientThesaurus;
  const templates = useAtomValue(templatesAtom);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [groupFormValues, setGroupFormValues] = useState<ThesaurusRow>();
  const [itemFormValues, setItemFormValues] = useState<ThesaurusRow[]>([]);
  const [showThesauriValueFormSidepanel, setShowThesauriValueFormSidepanel] = useState(false);
  const [showThesauriGroupFormSidepanel, setShowThesauriGroupFormSidepanel] = useState(false);
  const [selectedThesaurusValue, setSelectedThesaurusValue] = useState<ThesaurusRow[]>([]);
  const [thesaurusValues, setThesaurusValues] = useState<ThesaurusRow[]>([]);
  const [warnAboutUse, setWarnAboutUse] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState<ConfirmationCallback>();
  const setNotifications = useSetAtom(notificationAtom);

  useMemo(() => {
    const currentThesaurus = thesaurus || { values: [] };
    setWarnAboutUse(
      templates.find(t =>
        (t.properties || []).some(
          (property: PropertySchema) => property.content === currentThesaurus._id
        )
      ) !== undefined
    );
    setThesaurusValues(currentThesaurus.values.map(thesaurusAsRow));
  }, [templates, thesaurus]);

  const form = useForm<ClientThesaurus>({ defaultValues: thesaurus, mode: 'onSubmit' });
  const { watch, getValues, setValue } = form;

  const getCurrentStatus = useCallback(
    () => ({ ...getValues(), values: sanitizeThesaurusValues(thesaurusValues) }),
    [getValues, thesaurusValues]
  );

  const checkPendingChanges = useCallback(
    (nextLocation?: Location<any> | undefined) =>
      !nextLocation?.pathname.includes('edit') && compareThesaurus(thesaurus, getCurrentStatus()),
    [getCurrentStatus, thesaurus]
  );

  const blocker = useBlocker(({ nextLocation }) => checkPendingChanges(nextLocation));

  useMemo(() => {
    if (blocker.state === 'blocked') {
      setShowNavigationModal(true);
    }
  }, [blocker, setShowNavigationModal]);

  const addItem = () => {
    setItemFormValues([]);
    setShowThesauriValueFormSidepanel(true);
  };
  const addGroup = () => {
    setGroupFormValues(emptyThesaurus());
    setShowThesauriGroupFormSidepanel(true);
  };
  const editGroup = (row: Row<ThesaurusRow>) => {
    setGroupFormValues(row.original);
    setShowThesauriGroupFormSidepanel(true);
  };
  const editValue = (row: Row<ThesaurusRow>) => {
    setItemFormValues([{ ...row.original, groupId: row.getParentRow()?.original.rowId }]);
    setShowThesauriValueFormSidepanel(true);
  };

  const edit = (row: Row<ThesaurusRow>) => (row.original.subRows ? editGroup(row) : editValue(row));

  const proceedDeletion = () => {
    setThesaurusValues(prev => {
      selectedThesaurusValue.forEach(deletedItem => {
        removeItem(prev, deletedItem);
      });
      return [...prev];
    });
  };
  const deleteSelected = () => {
    if (!warnAboutUse || !selectedThesaurusValue[0].id) {
      proceedDeletion();
    } else {
      setConfirmCallback({ callback: proceedDeletion });
    }
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-thesauri"
    >
      <SettingsContent className="flex flex-col h-full">
        <SettingsContent.Header
          path={new Map([['Thesauri', '/settings/thesauri']])}
          title={watch('name')}
        />
        <SettingsContent.Body>
          <ThesaurusForm
            thesaurus={thesaurus}
            edit={edit}
            form={form}
            thesaurusValues={thesaurusValues}
            setThesaurusValues={setThesaurusValues}
            setSelectedThesaurusValue={setSelectedThesaurusValue}
          />
        </SettingsContent.Body>
        <SettingsContent.Footer className="bottom-0 bg-indigo-50">
          {!isEmpty(selectedThesaurusValue) && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={deleteSelected}
                color="error"
                data-testid="thesauri-remove-button"
              >
                <Translate>Remove</Translate>
              </Button>
              <Translate>Selected</Translate> {selectedThesaurusValue.length}
              <Translate>of</Translate> {thesaurusValues.length}
            </div>
          )}
          {selectedThesaurusValue.length === 0 && (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button onClick={addItem}>
                  <Translate>Add item</Translate>
                </Button>
                <Button styling="light" onClick={addGroup}>
                  <Translate>Add group</Translate>
                </Button>
                <Button styling="light" onClick={sortValues(thesaurusValues, setThesaurusValues)}>
                  <Translate>Sort</Translate>
                </Button>
                <ImportButton
                  onClick={() => {
                    setIsImporting(true);
                  }}
                  disabled={isEmpty(getValues().name)}
                  getThesaurus={getCurrentStatus}
                  onSuccess={(savedThesaurus: ThesaurusSchema) => {
                    setValue('_id', savedThesaurus._id);
                    setNotifications({
                      type: 'success',
                      text: <Translate>Thesauri updated.</Translate>,
                    });
                    navigate(`../edit/${savedThesaurus._id}`);
                    setIsImporting(false);
                  }}
                  onFailure={() => {
                    setIsImporting(false);
                    setNotifications({
                      type: 'error',
                      text: <Translate>Error adding thesauri.</Translate>,
                    });
                  }}
                />
              </div>
              <ThesaurusActions disabled={isImporting} />
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <ThesaurusValueForm
        showSidepanel={showThesauriValueFormSidepanel}
        submit={addItemSubmit(thesaurusValues, setThesaurusValues)}
        value={itemFormValues}
        closePanel={() => {
          setShowThesauriValueFormSidepanel(false);
        }}
        thesaurusValues={thesaurusValues}
      />
      <GroupForm
        showSidepanel={showThesauriGroupFormSidepanel}
        submit={addGroupSubmit(thesaurusValues, setThesaurusValues)}
        value={groupFormValues}
        closePanel={() => {
          setShowThesauriGroupFormSidepanel(false);
        }}
      />
      {showNavigationModal && (
        <ConfirmNavigationModal setShowModal={setShowNavigationModal} onConfirm={blocker.proceed} />
      )}
      {confirmCallback !== undefined && (
        <DeletionModal confirmCallback={confirmCallback} setConfirmCallback={setConfirmCallback} />
      )}
    </div>
  );
};
export { EditThesaurus };
