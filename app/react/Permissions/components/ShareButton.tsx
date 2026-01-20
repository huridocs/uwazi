import { Translate } from '#app/I18N/index.js';

import Icon from '#UI/Icon/Icon.jsx';
import React, { useState } from 'react';
import { ShareEntityModal } from '#app/Permissions/components/ShareEntityModal.jsx';

interface ShareButtonProps {
  sharedIds: string[];
  storeKey: string;
}

export const ShareButton = ({ sharedIds, storeKey }: ShareButtonProps) => {
  const [sharing, setSharing] = useState(false);

  return (
    <>
      <button className="btn btn-success share-btn" type="button" onClick={() => setSharing(true)}>
        <Icon icon="user-plus" />
        <span className="btn-label">
          <Translate>Share</Translate>
        </span>
      </button>
      {sharing ? (
        <ShareEntityModal
          key={sharedIds.join('-')}
          isOpen
          onClose={() => setSharing(false)}
          sharedIds={sharedIds}
          storeKey={storeKey}
        />
      ) : null}
    </>
  );
};
