import React from 'react';
import { Translate } from 'app/I18N';
import { ClientUserSchema } from 'app/apiResponseTypes';
import { InputField, Select } from '../../Forms';

interface UserFormProps {
  selected?: ClientUserSchema;
}

const UserForm = ({ selected }: UserFormProps) => {
  return (
    <form>
      <fieldset className="border border-slate-800 rounded-lg p-2">
        <legend>
          <Translate>General Information</Translate>
        </legend>
        <InputField label="Username" value={selected?.username} id="username" />
        <Select
          label="User Role"
          id="username"
          options={[
            { key: 'editor', value: 'editor', selected: selected?.role === 'editor' },
            { key: 'edmin', value: 'admin', selected: selected?.role === 'admin' },
            {
              key: 'collaborator',
              value: 'collaborator',
              selected: selected?.role === 'collaborator',
            },
          ]}
        />
        <InputField label="Email" value={selected?.email} id="email" />
      </fieldset>

      <fieldset className="border border-slate-800 rounded-lg border-r-8 p-2">
        <legend>
          <Translate>Security</Translate>
        </legend>
        <InputField label="Password" value={selected?.password} id="password" />
      </fieldset>

      <fieldset className="border border-slate-800 rounded-lg border-r-8 p-2">
        <legend>
          <Translate>Groups</Translate>
        </legend>
      </fieldset>
    </form>
  );
};

export { UserForm };
