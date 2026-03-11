import type {
  MappingTypeMapping,
  QueryDslQueryContainer,
  SearchResponse,
  SearchSourceFilter,
  SortCombinations,
} from '@elastic/elasticsearch/api/types';

export type { SearchResponse };

export interface TenantContextData {
  tenantId: string;
  userId: string;
}

export interface AuthorizationContext {
  isAdmin: boolean;
  allowedResourceIds?: string[];
  allowedAttributes?: Record<string, string[]>;
}

export interface ExecutionContext extends TenantContextData {
  authorization: AuthorizationContext;
}

export interface IndexDefinition {
  alias: string;
  physicalPrefix: string;
  settings: Record<string, unknown>;
  mappings: MappingTypeMapping;
}

export interface SearchOptions {
  alias: string;
  query: QueryDslQueryContainer;
  from?: number;
  size?: number;
  sort?: SortCombinations | SortCombinations[];
  source?: boolean | string[] | SearchSourceFilter;
}

export interface IndexOptions {
  alias: string;
  id: string;
  document: Record<string, unknown>;
}

export interface DeleteOptions {
  alias: string;
  id: string;
}

export interface BulkOperation {
  id: string;
  document: Record<string, unknown>;
}

export interface BulkOptions {
  alias: string;
  operations: BulkOperation[];
}

export interface TenantRoutingRecord {
  tenantId: string;
  logicalName: string;
  resolvedAlias: string;
}
