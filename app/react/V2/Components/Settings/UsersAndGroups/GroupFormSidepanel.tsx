import React from 'react';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';
import { Sidepanel } from 'V2/Components/UI';

interface GroupFormSidepanelProps {
  selectedGroup?: ClientUserGroupSchema;
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<
    React.SetStateAction<ClientUserSchema | ClientUserGroupSchema | undefined>
  >;
}

const GroupFormSidepanel = ({
  selectedGroup,
  showSidepanel,
  setShowSidepanel,
  setSelected,
}: GroupFormSidepanelProps) => (
  <Sidepanel
    isOpen={showSidepanel}
    withOverlay
    closeSidepanelFunction={() => {
      setSelected(undefined);
      setShowSidepanel(false);
    }}
    title={selectedGroup ? <Translate>Edit group</Translate> : <Translate>New group</Translate>}
  >
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
  </Sidepanel>
);

export { GroupFormSidepanel };
