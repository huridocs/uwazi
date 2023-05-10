/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useLoaderData } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';

interface GroupFormSidepanelProps {
  selectedGroup?: ClientUserGroupSchema;
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<
    React.SetStateAction<ClientUserSchema | ClientUserGroupSchema | undefined>
  >;
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
}: GroupFormSidepanelProps) => {
  const { groups } = useLoaderData() as { groups: ClientUserGroupSchema[] };
  const defaultValues = { name: '', members: [] } as ClientUserGroupSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues,
    values: selectedGroup,
  });

  const closeSidePanel = () => {
    setSelected(undefined);
    reset(defaultValues);
    setShowSidepanel(false);
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={() => {
        setSelected(undefined);
        setShowSidepanel(false);
      }}
      title={selectedGroup ? <Translate>Edit group</Translate> : <Translate>New group</Translate>}
    >
      <form
        onSubmit={handleSubmit(data => {
          console.log(data);
        })}
        className="flex flex-col h-full"
      >
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
                      {errors.name.type === 'maxLength' && <Translate>Name is too long</Translate>}
                      {errors.name.type === 'minLength' && <Translate>Name is too short</Translate>}
                    </div>
                  )}
                </span>
              </div>
            </div>
          </fieldset>

          <fieldset className="mb-5 border rounded-md border-gray-50 shadow-sm">
            <Translate className="block w-full bg-gray-50 text-primary-700 font-semibold text-lg p-2">
              Members
            </Translate>
          </fieldset>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-grow"
            type="button"
            buttonStyle="secondary"
            onClick={closeSidePanel}
          >
            <Translate>Cancel</Translate>
          </Button>
          <Button className="flex-grow" type="submit" buttonStyle="primary">
            <Translate>Save</Translate>
          </Button>
        </div>
      </form>
    </Sidepanel>
  );
};

export { GroupFormSidepanel };
