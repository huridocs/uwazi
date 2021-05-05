import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import React, { useState } from 'react';
import { ShareEntityModal } from './ShareEntityModal';

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
