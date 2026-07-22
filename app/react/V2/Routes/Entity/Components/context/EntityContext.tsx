import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Entity } from '#V2/api/entities/types.js';

type EntityContextValue = {
  entity: Entity;
  setEntity: (entity: Entity) => void;
};

const EntityContext = createContext<EntityContextValue | null>(null);

const EntityProvider = ({
  entity: loaderEntity,
  children,
}: {
  entity: Entity;
  children: React.ReactNode;
}) => {
  const [entityOverride, setEntity] = useState<Entity>();
  const entity = entityOverride ?? loaderEntity;

  useEffect(() => {
    setEntity(prev => {
      if (!prev) {
        return undefined;
      }
      if (prev.sharedId !== loaderEntity.sharedId) {
        return undefined;
      }
      if (prev.language && loaderEntity.language && prev.language !== loaderEntity.language) {
        return prev;
      }
      return undefined;
    });
  }, [loaderEntity]);

  const value = useMemo(() => ({ entity, setEntity }), [entity]);

  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
};

const useEntityContext = () => {
  const context = useContext(EntityContext);
  if (!context) throw new Error('Entity context not found');
  return context;
};

const useEntityScopedEntity = () => useEntityContext().entity;

export { EntityProvider, useEntityContext, useEntityScopedEntity };
