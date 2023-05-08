import React from 'react';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema } from 'app/apiResponseTypes';

interface GroupFormProps {
  selected?: ClientUserGroupSchema;
}

const GroupForm = ({ selected }: GroupFormProps) => (
  <>
    <fieldset>
      <legend>
        <Translate>Group options</Translate>
      </legend>
    </fieldset>

    <fieldset>
      <legend>
        <Translate>Members</Translate>
      </legend>
    </fieldset>
  </>
);

export { GroupForm };
