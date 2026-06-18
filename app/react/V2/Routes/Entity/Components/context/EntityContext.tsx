import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Entity } from '#V2/api/entities/types.js';

type EntityContextValue = {
  entity: Entity;
  setEntity: (entity: Entity) => void;
};

const EntityContext = createContext<EntityContextValue | null>(null);

const EntityProvider = ({ entity, children }: { entity: Entity; children: React.ReactNode }) => {
  const [currentEntity, setEntity] = useState(entity);

  useEffect(() => {
    setEntity(entity);
  }, [entity]);

  const value = useMemo(() => ({ entity: currentEntity, setEntity }), [currentEntity]);

  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
};

const useEntityContext = () => {
  const context = useContext(EntityContext);
  if (!context) throw new Error('Entity context not found');
  return context;
};

const useEntityScopedEntity = () => useEntityContext().entity;

export { EntityProvider, useEntityContext, useEntityScopedEntity };
