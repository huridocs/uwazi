/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useForm } from 'react-hook-form';
import { Translate } from 'app/I18N';
import { ClientUserSchema } from 'app/apiResponseTypes';
import { InputField, Select } from 'V2/Components/Forms';
import { Button } from 'V2/Components/UI';

interface UserFormProps {
  selected?: ClientUserSchema;
}

const UserForm = ({ selected }: UserFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: selected });

  const userRoles = [
    { key: 'admin', value: 'admin' },
    { key: 'editor', value: 'editor' },
    {
      key: 'collaborator',
      value: 'collaborator',
    },
  ];

  return (
    <form
      onSubmit={handleSubmit(data => {
        console.log(data);
      })}
    >
      <fieldset className="border border-slate-800 rounded-lg p-2">
        <legend>
          <Translate>General Information</Translate>
        </legend>
        <InputField
          label={<Translate>Username</Translate>}
          id="username"
          {...register('username', { required: true })}
        />
        <Select
          label={<Translate>User Role</Translate>}
          id="roles"
          options={userRoles}
          {...register('role')}
        />
        <InputField
          label={<Translate>Email</Translate>}
          type="email"
          id="email"
          {...register('email')}
        />
      </fieldset>

      <fieldset className="border border-slate-800 rounded-lg border-r-8 p-2">
        <legend>
          <Translate>Security</Translate>
        </legend>
        <InputField
          label={<Translate>Password</Translate>}
          id="password"
          type="password"
          autoComplete="off"
          {...register('password')}
        />
      </fieldset>

      <fieldset className="border border-slate-800 rounded-lg border-r-8 p-2">
        <legend>
          <Translate>Groups</Translate>
        </legend>
      </fieldset>

      <div>
        <Button type="button" buttonStyle="secondary">
          <Translate>Cancel</Translate>
        </Button>
        <Button type="submit" buttonStyle="primary">
          <Translate>Save</Translate>
        </Button>
      </div>
    </form>
  );
};

export { UserForm };
