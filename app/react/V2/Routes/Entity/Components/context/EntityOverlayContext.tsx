import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';

type OverlayTarget = {
  sharedId: string;
  title: string;
  templateId: string;
};

type OverlayEntry = OverlayTarget & { id: string };

type EntityOverlayState = { target: OverlayEntry | null; stack: OverlayEntry[] };
type EntityOverlayActions = {
  openEntityOverlay: (marker: RelationshipMarker) => void;
  openEntityOverlayTarget: (target: OverlayTarget) => void;
  closeOverlayFrom: (index: number) => void;
  closeEntityOverlay: () => void;
};

const EntityOverlayStateContext = createContext<EntityOverlayState | null>(null);
const EntityOverlayActionsContext = createContext<EntityOverlayActions | null>(null);

const EntityOverlayProvider = ({ children }: { children: React.ReactNode }) => {
  const [stack, setStack] = useState<OverlayEntry[]>([]);
  const nextId = useRef(0);
  const target = stack[stack.length - 1] ?? null;

  const openEntityOverlayTarget = useCallback((next: OverlayTarget) => {
    setStack(current => {
      const top = current[current.length - 1];
      if (top?.sharedId === next.sharedId) return current;
      nextId.current += 1;
      return [...current, { ...next, id: String(nextId.current) }];
    });
  }, []);

  const openEntityOverlay = useCallback(
    (marker: RelationshipMarker) => {
      openEntityOverlayTarget({
        sharedId: marker.target.sharedId,
        title: marker.target.title,
        templateId: marker.target.templateId,
      });
    },
    [openEntityOverlayTarget]
  );

  const closeOverlayFrom = useCallback((index: number) => {
    setStack(current => current.slice(0, index));
  }, []);

  const closeEntityOverlay = useCallback(() => {
    setStack([]);
  }, []);

  const state = useMemo(() => ({ target, stack }), [stack, target]);
  const actions = useMemo(
    () => ({ openEntityOverlay, openEntityOverlayTarget, closeOverlayFrom, closeEntityOverlay }),
    [closeEntityOverlay, closeOverlayFrom, openEntityOverlay, openEntityOverlayTarget]
  );

  return (
    <EntityOverlayActionsContext.Provider value={actions}>
      <EntityOverlayStateContext.Provider value={state}>
        {children}
      </EntityOverlayStateContext.Provider>
    </EntityOverlayActionsContext.Provider>
  );
};

const useEntityOverlayTarget = () => {
  const context = useContext(EntityOverlayStateContext);
  if (!context) throw new Error('Entity overlay state context not found');
  return context;
};

const useEntityOverlayActions = () => {
  const context = useContext(EntityOverlayActionsContext);
  if (!context) throw new Error('Entity overlay actions context not found');
  return context;
};

const useEntityOverlay = () => ({
  ...useEntityOverlayTarget(),
  ...useEntityOverlayActions(),
});

export type { OverlayTarget };
export { EntityOverlayProvider, useEntityOverlay, useEntityOverlayTarget, useEntityOverlayActions };
