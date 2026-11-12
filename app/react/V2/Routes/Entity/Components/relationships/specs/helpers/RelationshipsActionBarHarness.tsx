import React, { useState } from 'react';
import { RelationshipsTabFooter } from '#V2/Routes/Entity/Tabs/footers/RelationshipsTabFooter.js';
import { RelationshipsActionBar } from '../../panel/RelationshipsActionBar.js';
import { RelationshipsPanel } from '../../panel/RelationshipsPanel.js';
import { CreateRelationshipModal } from '../../create-reference/CreateRelationshipModal.js';
import { ManageRelationTypesModal } from '../../create-reference/ManageRelationTypesModal.js';

const RelationshipsActionBarHarness = ({
  compact,
  footer = false,
}: {
  compact: boolean;
  footer?: boolean;
}) => {
  const [showPanel, setShowPanel] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setShowPanel(current => !current)}>
        {showPanel ? 'Hide relationships panel' : 'Show relationships panel'}
      </button>
      {showPanel ? <RelationshipsPanel /> : null}
      {footer ? <RelationshipsTabFooter /> : <RelationshipsActionBar compact={compact} />}
      <CreateRelationshipModal />
      <ManageRelationTypesModal />
    </>
  );
};

export { RelationshipsActionBarHarness };
