import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';

type OverlayTarget = {
  sharedId: string;
  title: string;
  templateId: string;
};

type EntityOverlayState = { target: OverlayTarget | null };
type EntityOverlayActions = {
  openEntityOverlay: (marker: RelationshipMarker) => void;
  openEntityOverlayTarget: (target: OverlayTarget) => void;
  closeEntityOverlay: () => void;
};

const EntityOverlayStateContext = createContext<EntityOverlayState | null>(null);
const EntityOverlayActionsContext = createContext<EntityOverlayActions | null>(null);

const EntityOverlayProvider = ({ children }: { children: React.ReactNode }) => {
  const [target, setTarget] = useState<OverlayTarget | null>(null);

  const openEntityOverlayTarget = useCallback((next: OverlayTarget) => {
    setTarget(next);
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

  const closeEntityOverlay = useCallback(() => {
    setTarget(null);
  }, []);

  const state = useMemo(() => ({ target }), [target]);
  const actions = useMemo(
    () => ({ openEntityOverlay, openEntityOverlayTarget, closeEntityOverlay }),
    [closeEntityOverlay, openEntityOverlay, openEntityOverlayTarget]
  );

  return (
    <EntityOverlayActionsContext.Provider value={actions}>
      <EntityOverlayStateContext.Provider value={state}>
        {children}
      </EntityOverlayStateContext.Provider>
    </EntityOverlayActionsContext.Provider>
  );
};

const useEntityOverlayState = () => {
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
  ...useEntityOverlayState(),
  ...useEntityOverlayActions(),
});

export { EntityOverlayProvider, useEntityOverlay };
