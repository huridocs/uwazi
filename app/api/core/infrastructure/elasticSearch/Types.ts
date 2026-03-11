/* eslint-disable max-classes-per-file */
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

export interface ProvisioningResult {
  success: boolean;
  operation: 'create-group' | 'assign-tenant';
  details: Record<string, unknown>;
  durationMs: number;
}

export class GroupAlreadyExistsError extends Error {
  constructor(groupName: string, alias: string) {
    super(`Group '${groupName}' already exists with alias '${alias}'`);
    this.name = 'GroupAlreadyExistsError';
  }
}

export class TenantAlreadyInGroupError extends Error {
  constructor(tenantId: string, groupName: string) {
    super(`Tenant '${tenantId}' is already in group '${groupName}'`);
    this.name = 'TenantAlreadyInGroupError';
  }
}

export class GroupNotFoundError extends Error {
  constructor(groupName: string, alias: string) {
    super(`Group '${groupName}' not found — alias '${alias}' does not exist`);
    this.name = 'GroupNotFoundError';
  }
}

export class BulkIndexingError extends Error {
  constructor() {
    super('Bulk indexing operation completed with one or more partial failures.');
    this.name = 'BulkIndexingError';
  }
}

export class MigrationValidationError extends Error {
  constructor(physicalIndex: string) {
    super(`Validation failed before alias swap — new index "${physicalIndex}" has been deleted.`);
    this.name = 'MigrationValidationError';
  }
}
