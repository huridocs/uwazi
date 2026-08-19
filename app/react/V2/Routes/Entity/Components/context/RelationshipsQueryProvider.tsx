import React, { createContext, useContext, useMemo } from 'react';
import type { RelationshipQueryPayload } from '#V2/api/relationships/types.js';
import type { RelationshipView } from '#V2/formatters/relationships/types.js';
import { useEntityScopedEntity } from './EntityContext.js';
import { useEntityLanguage } from './EntityLanguageContext.js';
import { useRelationshipsQueryStore } from './hooks/useRelationshipsQueryStore.js';

type RelationshipQueryStatus = {
  resolved: boolean;
  resolving: boolean;
};

type RelationshipsQueryState = {
  views: RelationshipView[];
  status: RelationshipQueryStatus;
  ensureAnchors: () => Promise<void>;
  ensureResolved: () => Promise<void>;
};

const RelationshipsQueryContext = createContext<RelationshipsQueryState | null>(null);

type RelationshipsQueryProviderProps = {
  seed?: RelationshipQueryPayload;
  children: React.ReactNode;
};

const RelationshipsQueryProvider = ({ seed, children }: RelationshipsQueryProviderProps) => {
  const entity = useEntityScopedEntity();
  const { language, mainDocument } = useEntityLanguage();
  const { hubRows, hasResolved, resolving, ensureAnchors, ensureResolved, relationshipsQuery } =
    useRelationshipsQueryStore({
      seed,
      sharedId: entity.sharedId,
      language,
      fileId: mainDocument?._id,
    });

  const views = useMemo(
    () => relationshipsQuery.toViews(entity.sharedId, hubRows),
    [entity.sharedId, hubRows, relationshipsQuery]
  );
  const status = useMemo(() => ({ resolved: hasResolved, resolving }), [hasResolved, resolving]);
  const value = useMemo(
    () => ({ views, status, ensureAnchors, ensureResolved }),
    [ensureAnchors, ensureResolved, status, views]
  );

  return (
    <RelationshipsQueryContext.Provider value={value}>
      {children}
    </RelationshipsQueryContext.Provider>
  );
};

const useRelationshipsQuery = () => {
  const context = useContext(RelationshipsQueryContext);
  if (!context) {
    throw new Error('Relationships query context not found');
  }
  return context;
};

const useRelationshipViews = () => useRelationshipsQuery().views;
const useRelationshipQueryStatus = () => useRelationshipsQuery().status;
const useEnsureAnchors = () => useRelationshipsQuery().ensureAnchors;
const useEnsureResolved = () => useRelationshipsQuery().ensureResolved;

export {
  RelationshipsQueryProvider,
  useRelationshipViews,
  useRelationshipQueryStatus,
  useEnsureAnchors,
  useEnsureResolved,
};
