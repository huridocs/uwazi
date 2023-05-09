import React from 'react';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema } from 'app/apiResponseTypes';
import { Sidepanel } from 'V2/Components/UI';

interface GroupFormSidepanelProps {
  selectedGroup?: ClientUserGroupSchema;
  showSidepanel;
  setShowSidepanel;
  setSelected;
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
