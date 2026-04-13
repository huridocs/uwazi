/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router';
import { t, Translate } from '#app/I18N/index.js';
import { Button, Card, Sidepanel } from '#V2/Components/UI/index.js';
import { InputField, MultiSelect } from '#V2/Components/Forms/index.js';
import { UserGroupSchema } from '#shared/types/userGroupType.js';
import { User, Group } from '../types.js';

interface GroupFormSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<React.SetStateAction<User | Group | undefined>>;
  selectedGroup?: Group;
  users?: User[];
  groups?: Group[];
}

const isUnique = (name: string, selectedGroup?: Group, userGroups?: Group[]) =>
  !userGroups?.find(
    userGroup =>
      userGroup._id !== selectedGroup?._id &&
      userGroup.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

const getFieldError = (type?: string) => {
  switch (type) {
    case 'required':
      return 'Name is required';
    case 'validate':
      return 'Duplicated name';
    case 'maxLength':
      return 'Name is too long';
    case 'minLength':
      return 'Name is too short';
    default:
      return undefined;
  }
};

const GroupFormSidepanel = ({
  selectedGroup,
  showSidepanel,
  setShowSidepanel,
  setSelected,
  groups,
  users,
}: GroupFormSidepanelProps) => {
  const fetcher = useFetcher();

  const defaultValues = selectedGroup || ({ name: '', members: [] } as UserGroupSchema);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues,
    values: defaultValues,
  });

  const closeSidepanel = () => {
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
    await fetcher.submit(formData, { method: 'post' });
    closeSidepanel();
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closeSidepanel}
      title={selectedGroup ? <Translate>Edit group</Translate> : <Translate>New group</Translate>}
    >
      <form onSubmit={handleSubmit(formSubmit)} className="flex flex-col h-full">
        <Sidepanel.Body>
          <div className="flex flex-col grow gap-4">
            <Card title={<Translate>Group Options</Translate>}>
              <div>
                <InputField
                  label={<Translate className="block mb-1 font-bold">Name</Translate>}
                  id="name"
                  autoComplete="off"
                  errorMessage={getFieldError(errors.name?.type)}
                  className="mb-1"
                  {...register('name', {
                    required: true,
                    validate: username => isUnique(username, selectedGroup, groups),
                    maxLength: 50,
                    minLength: 3,
                  })}
                />
              </div>
            </Card>

            <div className="mb-5 rounded-md border border-gray-50 shadow-md">
              <MultiSelect
                label={
                  <Translate className="block w-full text-base font-semibold">Members</Translate>
                }
                onChange={selected =>
                  setValue(
                    'members',
                    selected.map(s => ({ refId: s })),
                    { shouldDirty: true }
                  )
                }
                options={
                  users?.map(user => ({ label: user.username, value: user._id as string })) || []
                }
                value={selectedGroup?.members?.map(member => member.refId) || []}
                placeholder={t('System', 'Nothing selected', null, false)}
              />
            </div>
          </div>
        </Sidepanel.Body>
        <Sidepanel.Footer className="px-4 py-3">
          <div className="flex gap-2">
            <Button className="grow" type="button" variant="secondary" onClick={closeSidepanel}>
              <Translate>Cancel</Translate>
            </Button>
            <Button className="grow" type="submit">
              <Translate>Save</Translate>
            </Button>
          </div>
        </Sidepanel.Footer>
      </form>
    </Sidepanel>
  );
};

export { GroupFormSidepanel };
