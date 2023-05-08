import React from 'react';
import { Translate } from 'app/I18N';
import { ClientUserSchema } from 'app/apiResponseTypes';

interface UserFormProps {
  selected?: ClientUserSchema;
}

const UserForm = ({ selected }: UserFormProps) => (
  <>
    <fieldset>
      <legend>
        <Translate>General Information</Translate>
      </legend>
    </fieldset>

    <fieldset>
      <legend>
        <Translate>Secuiry</Translate>
      </legend>
    </fieldset>

    <fieldset>
      <legend>
        <Translate>Groups</Translate>
      </legend>
    </fieldset>
  </>
);

export { UserForm };
