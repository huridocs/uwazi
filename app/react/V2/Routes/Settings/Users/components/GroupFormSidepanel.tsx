/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Button, Card, Sidepanel } from 'V2/Components/UI';
import { InputField, MultiSelect } from 'V2/Components/Forms';
import { UserGroupSchema } from 'shared/types/userGroupType';

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

const getAvailableUsers = (users?: ClientUserSchema[], selectedGroup?: ClientUserGroupSchema) =>
  users?.map(user => {
    const members = selectedGroup?.members?.map(member => member.refId);

    if (members?.includes(user._id || '')) {
      return { label: user.username, value: user._id as string, selected: true };
    }

    return { label: user.username, value: user._id as string };
  });

const GroupFormSidepanel = ({
  selectedGroup,
  showSidepanel,
  setShowSidepanel,
  setSelected,
  groups,
  users,
}: GroupFormSidepanelProps) => {
  const fetcher = useFetcher();

  const defaultValues = { name: '', members: [] } as UserGroupSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues,
    values: selectedGroup,
  });

  const closeSidepanel = () => {
    reset(defaultValues);
    setSelected(undefined);
    setShowSidepanel(false);
  };

  const formSubmit = async (data: UserGroupSchema) => {
    const formData = new FormData();
    const formattedData = {
      ...data,
      members: data.members.map(member => ({ refId: member.refId })),
    };

    if (data._id) {
      formData.set('intent', 'edit-group');
    } else {
      formData.set('intent', 'new-group');
    }

    formData.set('data', JSON.stringify(formattedData));
    fetcher.submit(formData, { method: 'post' });
    setShowSidepanel(false);
    reset(defaultValues);
  };

  const availableUsers = getAvailableUsers(users, selectedGroup);

  const onChange = (options: { label: string; value: string; selected?: boolean }[]) => {
    const selected = options
      .filter(option => option.selected)
      .map(option => ({
        refId: option.value,
      }));

    setValue('members', selected, { shouldDirty: true });
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closeSidepanel}
      title={selectedGroup ? <Translate>Edit group</Translate> : <Translate>New group</Translate>}
    >
      <form onSubmit={handleSubmit(formSubmit)} className="flex flex-col h-full">
        <div className="flex flex-col flex-grow gap-4">
          <Card title={<Translate>Group Options</Translate>}>
            <div>
              <InputField
                label={<Translate className="block mb-1 font-bold">Name</Translate>}
                id="name"
                autoComplete="off"
                hasErrors={Boolean(errors.name)}
                className="mb-1"
                {...register('name', {
                  required: true,
                  validate: username => isUnique(username, selectedGroup, groups),
                  maxLength: 50,
                  minLength: 3,
                })}
              />
              <span className="font-bold text-error-700">
                {errors.name && (
                  <div>
                    {errors.name.type === 'required' && <Translate>Name is required</Translate>}
                    {errors.name.type === 'validate' && <Translate>Duplicated name</Translate>}
                    {errors.name.type === 'maxLength' && <Translate>Name is too long</Translate>}
                    {errors.name.type === 'minLength' && <Translate>Name is too short</Translate>}
                  </div>
                )}
              </span>
            </div>
          </Card>

          <div className="mb-5 rounded-md border border-gray-50 shadow-sm">
            <MultiSelect
              label={
                <Translate className="block w-full text-lg font-semibold bg-gray-50 text-primary-700">
                  Members
                </Translate>
              }
              onChange={options => onChange(options)}
              options={availableUsers || []}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-grow" type="button" styling="outline" onClick={closeSidepanel}>
            <Translate>Cancel</Translate>
          </Button>
          <Button className="flex-grow" type="submit">
            <Translate>Save</Translate>
          </Button>
        </div>
      </form>
    </Sidepanel>
  );
};

export { GroupFormSidepanel };
