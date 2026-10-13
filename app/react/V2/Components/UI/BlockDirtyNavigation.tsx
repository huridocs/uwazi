import React, { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';
import { DirtyDiscardModal } from './DirtyDiscardModal.js';
import { PendingTranslationModal } from './PendingTranslationModal.js';

type BlockDirtyNavigationProps = {
  when: boolean;
  onDiscard?: () => void;
  translationsPending?: boolean;
  onStopTranslations?: () => void;
  dirty?: boolean;
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

const BlockDirtyNavigation = ({
  when,
  onDiscard,
  translationsPending = false,
  onStopTranslations,
  dirty = false,
}: BlockDirtyNavigationProps) => {
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    shouldBlockDirtyLeave(when, currentLocation.pathname, nextLocation.pathname)
  );
  const leaving = useRef(false);

  useEffect(() => {
    if (!when && blocker.state === 'blocked' && !leaving.current) {
      blocker.reset?.();
    }
  }, [when, blocker]);

  if (blocker.state !== 'blocked') {
    return null;
  }

  if (translationsPending) {
    return (
      <PendingTranslationModal
        onAccept={() => {
          onStopTranslations?.();
          if (dirty) return;
          leaving.current = true;
          onDiscard?.();
          blocker.proceed?.();
        }}
        onCancel={() => blocker.reset?.()}
      />
    );
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
