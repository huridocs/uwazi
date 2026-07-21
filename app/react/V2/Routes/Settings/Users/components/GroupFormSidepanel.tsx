/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { t, Translate } from '#app/I18N/index.js';
import { Button, Card, Sidepanel } from '#V2/Components/UI/index.js';
import { InputField, MultiSelect } from '#V2/Components/Forms/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { useServices, type UserGroupInput } from '#V2/services/index.js';
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
  const { userGroups: userGroupsService } = useServices();
  const revalidator = useRevalidator();
  const { notify } = useRequestStatus();

  const defaultValues =
    selectedGroup ||
    ({
      name: '',
      members: [],
      rowId: 'NEW',
    } as Group);

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

  const formSubmit = async (data: Group) => {
    const formattedData: UserGroupInput = {
      _id: data._id,
      name: data.name,
      members: data.members.map(member => ({
        refId: member.refId,
        username: member.username ?? '',
      })),
    };

    const [, error] = await userGroupsService.upsert(formattedData);

    if (error) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        error.detail ?? error.message
      );
      return;
    }

    notify(
      'success',
      data._id ? t('System', 'Group updated', null, false) : t('System', 'Group saved', null, false)
    );
    await revalidator.revalidate();
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
          <div data-testid="group-sidepanel-snapshot" className="flex flex-col gap-4">
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

            <div className="mb-5 rounded-md border shadow-md border-[color-mix(in_srgb,var(--color-theme-border-default)_45%,transparent)] bg-(--color-theme-surface-raised)">
              <MultiSelect
                label={
                  <Translate className="block w-full text-base font-semibold">Members</Translate>
                }
                onChange={selected =>
                  setValue(
                    'members',
                    selected.map(s => {
                      const user = users?.find(u => u._id === s);
                      return { refId: s, username: user?.username ?? '' };
                    }),
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
