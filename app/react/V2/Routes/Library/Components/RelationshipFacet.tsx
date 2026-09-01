import React, { type ReactNode } from 'react';
import type { FacetLookup } from '../lookupAggregation.js';
import type { FacetMode } from './FacetCard.js';
import { KeywordFacet } from './KeywordFacet.js';
import type { LibraryFacetBucket } from '#shared/types/librarySearch.js';

type RelationshipFacetProps = {
  title: ReactNode;
  buckets: LibraryFacetBucket[];
  selected: string[];
  onToggle: (id: string) => void;
  lookup: FacetLookup;
  open?: boolean;
  mode?: FacetMode;
  onModeChange?: (mode: FacetMode) => void;
  onClear?: () => void;
};

const RelationshipFacet = ({ lookup, ...props }: RelationshipFacetProps) => (
  <KeywordFacet {...props} lookup={lookup} alwaysSearch />
);

export type { RelationshipFacetProps };
export { RelationshipFacet };
