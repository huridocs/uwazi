/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useMemo, useState } from 'react';
import { Location, useBlocker, useLoaderData, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAtomValue, useSetAtom } from 'jotai';
import { isEqual, orderBy, remove } from 'lodash';
import { Row } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { ClientThesaurus } from 'app/apiResponseTypes';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button } from 'V2/Components/UI';
import { ConfirmNavigationModal } from 'V2/Components/Forms';
import { notificationAtom, templatesAtom } from 'app/V2/atoms';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { PropertySchema } from 'shared/types/commonTypes';
import { emptyThesaurus, findItem, sanitizeThesaurusValues, thesaurusAsRow } from './helpers';
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
  const [confirmCallback, setConfirmCallback] = useState<ConfirmationCallback>();
  const setNotifications = useSetAtom(notificationAtom);

  useMemo(() => {
    if (thesaurus !== undefined && thesaurus !== null) {
      setWarnAboutUse(
        templates.find(t =>
          t.properties?.some((property: PropertySchema) => property.content === thesaurus._id)
        ) !== undefined
      );
      setThesaurusValues(thesaurus.values.map(thesaurusAsRow));
    }
  }, [templates, thesaurus]);

  const form = useForm<ClientThesaurus>({ defaultValues: thesaurus, mode: 'onSubmit' });
  const {
    watch,
    getValues,
    setValue,
    formState: { isDirty },
  } = form;

  const getCurrentStatus = useCallback(
    () => ({ ...getValues(), values: sanitizeThesaurusValues(thesaurusValues) }),
    [getValues, thesaurusValues]
  );

  const checkPendingChanges = useCallback(
    (nextLocation?: Location<any> | undefined) => {
      if (nextLocation?.pathname.includes('edit')) {
        return false;
      }
      const changedName = isDirty;
      const changedValues = !isEqual(thesaurus, getCurrentStatus());
      return changedName || changedValues;
    },
    [getCurrentStatus, isDirty, thesaurus]
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
    setGroupFormValues(emptyThesaurus);
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
  const edit = (row: Row<ThesaurusRow>) => {
    if (row.original.subRows) {
      editGroup(row);
    } else {
      editValue(row);
    }
  };
  const proceedDeletion = () => {
    setThesaurusValues(prev => {
      selectedThesaurusValue.forEach(deletedItem => {
        const removed = remove(prev, item => item.rowId === deletedItem.rowId);
        if (!removed.length) {
          prev
            .filter(prevItem => prevItem.subRows?.length)
            .forEach(prevItem =>
              remove(prevItem.subRows!, subItem => subItem.rowId === deletedItem.rowId)
            );
        }
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
  const sortValues = () => {
    setThesaurusValues([...orderBy(thesaurusValues, 'label')]);
  };
  const addItemSubmit = (items: ThesaurusRow[]) => {
    const prevItem = items.length === 1 ? findItem(thesaurusValues, items[0]) : null;
    if (!prevItem) {
      setThesaurusValues(prev => {
        items.forEach(({ groupId, ...newItem }) => {
          if (!groupId) {
            prev.push(newItem);
          } else {
            const group = prev.find(item => item.rowId === groupId)!;
            group.subRows = [...(group.subRows || []), newItem];
          }
        });
        return [...prev];
      });
    } else {
      prevItem.label = items[0].label;
      setThesaurusValues([...thesaurusValues]);
    }
  };
  const addGroupSubmit = (group: ThesaurusRow) => {
    setThesaurusValues(prev => {
      prev.push(group);
      return [...prev];
    });
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
          {selectedThesaurusValue.length ? (
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
          ) : (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button onClick={addItem}>
                  <Translate>Add item</Translate>
                </Button>
                <Button styling="light" onClick={addGroup}>
                  <Translate>Add group</Translate>
                </Button>
                <Button styling="light" onClick={sortValues}>
                  <Translate>Sort</Translate>
                </Button>
                <ImportButton
                  getThesaurus={getCurrentStatus}
                  onSuccess={(savedThesaurus: ThesaurusSchema) => {
                    setValue('_id', savedThesaurus._id);
                    setNotifications({
                      type: 'success',
                      text: <Translate>Thesauri updated.</Translate>,
                    });
                    navigate(`../edit/${savedThesaurus._id}`);
                  }}
                  onFailure={() => {
                    setNotifications({
                      type: 'error',
                      text: <Translate>Error adding thesauri.</Translate>,
                    });
                  }}
                />
              </div>
              <ThesaurusActions />
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <ThesaurusValueForm
        showSidepanel={showThesauriValueFormSidepanel}
        submit={addItemSubmit}
        value={itemFormValues}
        closePanel={() => {
          setShowThesauriValueFormSidepanel(false);
        }}
        thesaurusValues={thesaurusValues}
      />
      <GroupForm
        showSidepanel={showThesauriGroupFormSidepanel}
        submit={addGroupSubmit}
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
