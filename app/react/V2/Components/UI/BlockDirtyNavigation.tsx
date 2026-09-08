import React, { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { DirtyDiscardModal } from './DirtyDiscardModal.js';

type BlockDirtyNavigationProps = {
  when: boolean;
  onDiscard?: () => void;
};

const entityIdFromPath = (pathname: string) => {
  const v2 = pathname.match(/\/entityv2\/([^/]+)/);
  if (v2?.[1]) {
    return decodeURIComponent(v2[1]);
  }
  const entity = pathname.match(/\/entity\/([^/]+)/);
  return entity?.[1] ? decodeURIComponent(entity[1]) : undefined;
};

const shouldBlockDirtyLeave = (when: boolean, currentPathname: string, nextPathname: string) => {
  if (!when || currentPathname === nextPathname) {
    return false;
  }
  const currentId = entityIdFromPath(currentPathname);
  const nextId = entityIdFromPath(nextPathname);
  return !(currentId && nextId && currentId === nextId);
};

const BlockDirtyNavigation = ({ when, onDiscard }: BlockDirtyNavigationProps) => {
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    shouldBlockDirtyLeave(when, currentLocation.pathname, nextLocation.pathname)
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
      onDiscard={() => {
        onDiscard?.();
        blocker.proceed?.();
      }}
      onCancel={() => blocker.reset?.()}
    />
  );
};

export type { BlockDirtyNavigationProps };
export { BlockDirtyNavigation, shouldBlockDirtyLeave };
