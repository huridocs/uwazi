/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { notificationAtom } from 'V2/atoms';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField, MultiSelect } from 'V2/Components/Forms';
import { ConfirmationModal } from './ConfirmationModal';

interface GroupFormSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<
    React.SetStateAction<ClientUserSchema | ClientUserGroupSchema | undefined>
  >;
  selectedGroup?: ClientUserGroupSchema;
  users?: ClientUserSchema[];
  groups?: ClientUserGroupSchema[];
}

const isUnique = (
  name: string,
  selectedGroup?: ClientUserGroupSchema,
  userGroups?: ClientUserGroupSchema[]
) =>
  !userGroups?.find(
    userGroup =>
      userGroup._id !== selectedGroup?._id &&
      userGroup.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

const GroupFormSidepanel = ({
  selectedGroup,
  showSidepanel,
  setShowSidepanel,
  setSelected,
  groups,
  users,
}: GroupFormSidepanelProps) => {
  const [showModal, setShowModal] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);
  const fetcher = useFetcher();

  const defaultValues = { name: '', members: [] } as ClientUserGroupSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
    setValue,
  } = useForm({
    defaultValues,
    values: selectedGroup,
  });

  const discardChangesFunction = () => {
    setSelected(undefined);
    reset(defaultValues);
    setShowSidepanel(false);
  };

  const handleSidepanelState = () => {
    if (isDirty) {
      setShowModal(true);
    } else {
      discardChangesFunction();
    }
  };

  const formSubmit = async (data: ClientUserGroupSchema) => {
    const formData = new FormData();
    if (data._id) {
      formData.set('intent', 'edit-group');
    } else {
      formData.set('intent', 'new-group');
    }
    formData.set('data', JSON.stringify(data));
    fetcher.submit(formData, { method: 'post' });
    reset({}, { keepValues: true });
  };

  useEffect(() => {
    setShowSidepanel(false);
    switch (true) {
      case fetcher.formData?.get('intent') === 'new-group':
        setNotifications({
          type: 'success',
          text: <Translate>Group saved</Translate>,
        });
        break;
      case fetcher.formData?.get('intent') === 'edit-group':
        setNotifications({
          type: 'success',
          text: <Translate>Group updated</Translate>,
        });
        break;
      default:
        console.log('Returned data');
        break;
    }
  }, [fetcher.data, fetcher.formData, setNotifications]);

  return (
    <>
      <Sidepanel
        isOpen={showSidepanel}
        withOverlay
        closeSidepanelFunction={handleSidepanelState}
        title={selectedGroup ? <Translate>Edit group</Translate> : <Translate>New group</Translate>}
      >
        <form onSubmit={handleSubmit(formSubmit)} className="flex flex-col h-full">
          <div className="flex-grow">
            <fieldset className="mb-5 border rounded-md border-gray-50 shadow-sm">
              <Translate className="block w-full bg-gray-50 text-primary-700 font-semibold text-lg p-2">
                Group Options
              </Translate>

              <div className="p-3">
                <div className="mb-4">
                  <InputField
                    label={<Translate className="font-bold block mb-1">Name</Translate>}
                    id="name"
                    hasErrors={Boolean(errors.name)}
                    className="mb-1"
                    {...register('name', {
                      required: true,
                      validate: username => isUnique(username, selectedGroup, groups),
                      maxLength: 50,
                      minLength: 3,
                    })}
                  />
                  <span className="text-error-700 font-bold">
                    {errors.name && (
                      <div className="validation-error">
                        {errors.name.type === 'required' && <Translate>Name is required</Translate>}
                        {errors.name.type === 'validate' && <Translate>Duplicated name</Translate>}
                        {errors.name.type === 'maxLength' && (
                          <Translate>Name is too long</Translate>
                        )}
                        {errors.name.type === 'minLength' && (
                          <Translate>Name is too short</Translate>
                        )}
                      </div>
                    )}
                  </span>
                </div>
              </div>
            </fieldset>
            <fieldset className="mb-5 border rounded-md border-gray-50 shadow-sm">
              <MultiSelect
                label={
                  <Translate className="block w-full bg-gray-50 text-primary-700 font-semibold text-lg">
                    Members
                  </Translate>
                }
                onChange={options => {
                  setValue(
                    'members',
                    options.map(option => ({ refId: option.value })),
                    { shouldDirty: true }
                  );
                }}
                options={(users || []).map(user => {
                  const members = selectedGroup?.members.map(member => member.refId) || [];
                  if (members.includes(user._id || '')) {
                    return { label: user.username, value: user._id as string, selected: true };
                  }
                  return { label: user.username, value: user._id as string };
                })}
              />
            </fieldset>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-grow"
              type="button"
              buttonStyle="secondary"
              onClick={discardChangesFunction}
            >
              <Translate>Cancel</Translate>
            </Button>
            <Button className="flex-grow" type="submit" buttonStyle="primary">
              <Translate>Save</Translate>
            </Button>
          </div>
        </form>
      </Sidepanel>
      {showModal && (
        <ConfirmationModal
          setShowModal={setShowModal}
          onConfirm={() => {
            setShowModal(false);
            discardChangesFunction();
          }}
        />
      )}
    </>
  );
};

export { GroupFormSidepanel };
