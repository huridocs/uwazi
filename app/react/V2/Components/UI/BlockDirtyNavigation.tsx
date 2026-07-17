import React, { useEffect, useState } from 'react';
import { useBlocker } from 'react-router';
import { DirtyDiscardModal } from './DirtyDiscardModal.js';

type BlockDirtyNavigationProps = {
  when: boolean;
  onDiscard?: () => void;
};

const BlockDirtyNavigation = ({ when, onDiscard }: BlockDirtyNavigationProps) => {
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
    <DirtyDiscardModal
      action="leave"
      onDiscard={() => {
        setShowModal(false);
        onDiscard?.();
        blocker.proceed?.();
      }}
      onCancel={() => {
        setShowModal(false);
        blocker.reset?.();
      }}
    />
  );
};

export type { BlockDirtyNavigationProps };
export { BlockDirtyNavigation };
