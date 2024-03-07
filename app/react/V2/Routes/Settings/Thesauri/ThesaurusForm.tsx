import React, { useEffect, useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { ColumnDef, Row, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, Table } from 'app/V2/Components/UI';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { ActionHeader, EditButton, ThesaurusValueLabel } from './components/TableComponents';
import { ConfirmNavigationModal, InputField } from 'app/V2/Components/Forms';
import { Link, LoaderFunction, useBlocker, useLoaderData, useRevalidator } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { ThesauriValueFormSidepanel } from './components/ThesauriValueFormSidepanel';
import { ThesauriGroupFormSidepanel } from './components/ThesauriGroupFormSidepanel';
import { LocalThesaurusValueSchema } from 'app/apiResponseTypes';
import { mergeValues, sanitizeThesaurusValues } from './helpers';
import { notificationAtom } from 'app/V2/atoms/notificationAtom';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { SubmitHandler, useForm } from 'react-hook-form';
import { RequestParams } from 'app/utils/RequestParams';
import { ImportButton } from './components/ImportButton';
import _, { isEqual } from 'lodash';
import uniqueID from 'shared/uniqueID';

const LabelHeader = () => <Translate>Label</Translate>;

const editTheasaurusLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { _id } }) => {
    const response = await ThesauriAPI.getThesauri(new RequestParams({ _id }, headers));
    return response[0];
  };

const ThesaurusForm = () => {
  const revalidator = useRevalidator();
  const thesaurus = useLoaderData() as ThesaurusSchema;
  const [editGroup, setEditGroup] = useState<LocalThesaurusValueSchema>();
  const [editValue, setEditValue] = useState<LocalThesaurusValueSchema>();
  const [showConfirmNavigationModal, setShowConfirmNavigationModal] = useState(false);
  const [showThesauriValueFormSidepanel, setShowThesauriValueFormSidepanel] = useState(false);
  const [showThesauriGroupFormSidepanel, setShowThesauriGroupFormSidepanel] = useState(false);
  const [selectedThesaurusValue, setSelectedThesaurusValue] = useState<
    Row<LocalThesaurusValueSchema>[]
  >([]);
  const [thesaurusValues, setThesaurusValues] = useState<LocalThesaurusValueSchema[]>([]);
  const setNotifications = useSetRecoilState(notificationAtom);

  useEffect(() => {
    setThesaurusValues(
      (thesaurus?.values?.map(val => ({
        ...val,
        _id: uniqueID(),
        values: val.values?.map(thesValue => ({ ...thesValue, _id: uniqueID() })),
      })) as LocalThesaurusValueSchema[]) || []
    );
  }, [thesaurus]);

  useEffect(() => {
    console.log('New thesaurus: ', thesaurusValues);
  }, [thesaurusValues]);

  const {
    watch,
    register,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<ThesaurusSchema>({
    defaultValues: thesaurus,
    mode: 'onSubmit',
  });

  const blocker = useBlocker(() => {
    return !isEqual(thesaurus.values, thesaurusValues) || getValues().name !== thesaurus.name;
  });

  useMemo(() => {
    if (blocker.state === 'blocked') {
      setShowConfirmNavigationModal(true);
    }
  }, [blocker, setShowConfirmNavigationModal]);

  const deleteSelected = () => {};

  const sortValues = () => {
    const valuesCopy = [...thesaurusValues];
    valuesCopy.sort((first, second) => (first.label > second.label ? 1 : -1));
    setThesaurusValues(valuesCopy);
  };

  const addItemSubmit = (items: LocalThesaurusValueSchema[]) => {};

  const addGroupSubmit = (group: LocalThesaurusValueSchema) => {
    if (editGroup) {
      const updatedValues = thesaurusValues.map(item => {
        if (item._id === group._id) {
          return group;
        }
        return item;
      });
      setThesaurusValues(updatedValues);
      setEditGroup(undefined);
      setShowThesauriGroupFormSidepanel(false);
      return;
    }
    console.log('Adding group: ', group);
    setThesaurusValues(old => {
      debugger;
      return [...old, { ...group }];
    });
    setShowThesauriGroupFormSidepanel(false);
  };

  const formSubmit: SubmitHandler<ThesaurusSchema> = async data => {
    const sanitizedThesaurus = sanitizeThesaurusValues(data, thesaurusValues);
    try {
      await ThesauriAPI.save(new RequestParams(sanitizedThesaurus));
      setNotifications({
        type: 'success',
        text: <Translate>Thesauri updated.</Translate>,
      });
    } catch (e) {
      setNotifications({
        type: 'error',
        text: <Translate>Error updating thesauri.</Translate>,
      });
    } finally {
      revalidator.revalidate();
    }
  };

  const checkDNDBeforeCommit = (values: LocalThesaurusValueSchema[]) => {
    const groups = values.filter(groupValue => Array.isArray(groupValue.values));
    let groupsHaveChanged = false;
    for (let i = 0; i < groups.length; i += 1) {
      const group = groups[i];
      const originalGroup = thesaurusValues.find(tv => tv._id === group._id);
      if (group.values?.length !== originalGroup?.values?.length) {
        groupsHaveChanged = true;
        break;
      }
    }

    if (!groupsHaveChanged) {
      setThesaurusValues(values);
    }
  };

  const columnHelper = createColumnHelper<any>();
  const columns = [
    columnHelper.accessor('label', {
      id: 'label',
      header: LabelHeader,
      cell: ThesaurusValueLabel,
      meta: { headerClassName: 'w-11/12' },
    }) as ColumnDef<LocalThesaurusValueSchema, 'label'>,
    columnHelper.accessor('_id', {
      header: ActionHeader,
      cell: EditButton,
      enableSorting: false,
      meta: {
        action: async (row: Row<LocalThesaurusValueSchema>) => {
          if (row.original.values && Array.isArray(row.original.values)) {
            setEditGroup(row.original as LocalThesaurusValueSchema);
            setShowThesauriGroupFormSidepanel(true);
          } else {
            await setEditValue(row.original as LocalThesaurusValueSchema);
            setShowThesauriValueFormSidepanel(true);
          }
        },
        headerClassName: 'text-center w-0',
      },
    }) as ColumnDef<LocalThesaurusValueSchema, '_id'>,
  ];

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-languages"
    >
      <SettingsContent className="flex flex-col h-full">
        <SettingsContent.Header
          path={new Map([['Thesauri', '/settings/thesauri']])}
          title={watch('name')}
        />
        <SettingsContent.Body>
          <form onSubmit={handleSubmit(formSubmit)} id="edit-thesaurus">
            <div data-testid="thesauri" className="border rounded-md shadow-sm border-gray-50">
              <div className="p-4">
                <InputField
                  clearFieldAction={() => {}}
                  id="thesauri-name"
                  placeholder="Thesauri name"
                  className="mb-2"
                  hasErrors={!!errors.name}
                  {...register('name', { required: true })}
                />
              </div>
              <Table<LocalThesaurusValueSchema>
                draggableRows
                enableSelection
                subRowsKey="values"
                onChange={checkDNDBeforeCommit}
                columns={columns}
                data={thesaurusValues}
                initialState={{ sorting: [{ id: 'label', desc: false }] }}
                onSelection={setSelectedThesaurusValue}
              />
            </div>
          </form>
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
              <Translate>Selected</Translate> {selectedThesaurusValue.length}{' '}
              <Translate>of</Translate> {thesaurusValues.length}
            </div>
          ) : (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button onClick={() => setShowThesauriValueFormSidepanel(true)}>
                  <Translate>Add item</Translate>
                </Button>
                <Button styling="outline" onClick={() => setShowThesauriGroupFormSidepanel(true)}>
                  <Translate>Add group</Translate>
                </Button>
                <Button styling="outline" onClick={sortValues}>
                  <Translate>Sort</Translate>
                </Button>
                <ImportButton
                  thesaurus={sanitizeThesaurusValues(getValues(), thesaurusValues)}
                  onSuccess={() => {
                    setNotifications({
                      type: 'success',
                      text: <Translate>Thesauri updated.</Translate>,
                    });
                    revalidator.revalidate();
                  }}
                  onFailure={() => {
                    setNotifications({
                      type: 'error',
                      text: <Translate>Error adding thesauri.</Translate>,
                    });
                  }}
                ></ImportButton>
              </div>
              <div className="flex gap-2">
                <Link to="/settings/thesauri">
                  <Button styling="light" type="button">
                    <Translate>Cancel</Translate>
                  </Button>
                </Link>
                <Button styling="solid" color="success" type="submit" form="edit-thesaurus">
                  <Translate>Save</Translate>
                </Button>
              </div>
            </div>
          )}
        </SettingsContent.Footer>
      </SettingsContent>
      <ThesauriValueFormSidepanel
        showSidepanel={showThesauriValueFormSidepanel}
        setShowSidepanel={setShowThesauriValueFormSidepanel}
        submit={addItemSubmit}
        value={editValue}
        closePanel={() => {
          setEditValue(undefined);
          setShowThesauriValueFormSidepanel(false);
        }}
        groups={thesaurusValues.filter((value: ThesaurusValueSchema) =>
          Array.isArray(value.values)
        )}
      />
      <ThesauriGroupFormSidepanel
        showSidepanel={showThesauriGroupFormSidepanel}
        setShowSidepanel={setShowThesauriGroupFormSidepanel}
        submit={addGroupSubmit}
        value={editGroup}
        closePanel={() => {
          setEditGroup(undefined);
          setShowThesauriGroupFormSidepanel(false);
        }}
      />
      {showConfirmNavigationModal && (
        <ConfirmNavigationModal
          setShowModal={setShowConfirmNavigationModal}
          onConfirm={blocker.proceed}
        />
      )}
    </div>
  );
};

export { ThesaurusForm, editTheasaurusLoader };
