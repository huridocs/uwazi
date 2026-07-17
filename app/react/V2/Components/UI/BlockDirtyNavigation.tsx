import React, { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { DirtyDiscardModal } from './DirtyDiscardModal.js';

type BlockDirtyNavigationProps = {
  when: boolean;
  onDiscard?: () => void;
};

const BlockDirtyNavigation = ({ when, onDiscard }: BlockDirtyNavigationProps) => {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!when && blocker.state === 'blocked') {
      blocker.reset?.();
    }
  }, [when, blocker]);

  if (blocker.state !== 'blocked') {
    return null;
  }

  return (
    <DirtyDiscardModal
      action="leave"
      onDiscard={() => {
        onDiscard?.();
        blocker.proceed?.();
      }}
      onCancel={() => blocker.reset?.()}
    />
  );
};

export type { BlockDirtyNavigationProps };
export { BlockDirtyNavigation };
