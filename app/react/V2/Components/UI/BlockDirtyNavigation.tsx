import React, { useEffect, useState } from 'react';
import { useBlocker } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { ConfirmationModal } from './ConfirmationModal.js';

type BlockDirtyNavigationProps = {
  when: boolean;
  onDiscard?: () => void;
  header?: React.ReactNode;
  body?: React.ReactNode;
  acceptButton?: React.ReactNode;
  cancelButton?: React.ReactNode;
};

const BlockDirtyNavigation = ({
  when,
  onDiscard,
  header = <Translate>Unsaved changes</Translate>,
  body = (
    <Translate>
      You have unsaved changes. Discard them and leave this page? This action cannot be undone.
    </Translate>
  ),
  acceptButton = <Translate>Discard and leave</Translate>,
  cancelButton = <Translate>Cancel</Translate>,
}: BlockDirtyNavigationProps) => {
  const [showModal, setShowModal] = useState(false);
  const blocker = useBlocker(when);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowModal(true);
    }
  }, [blocker]);

  if (!showModal || blocker.state !== 'blocked') {
    return null;
  }

  return (
    <ConfirmationModal
      header={header}
      body={body}
      acceptButton={acceptButton}
      cancelButton={cancelButton}
      dangerStyle
      onAcceptClick={() => {
        setShowModal(false);
        onDiscard?.();
        blocker.proceed?.();
      }}
      onCancelClick={() => {
        setShowModal(false);
        blocker.reset?.();
      }}
    />
  );
};

export type { BlockDirtyNavigationProps };
export { BlockDirtyNavigation };
