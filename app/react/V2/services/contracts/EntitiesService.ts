import type { ClientBlobFile, ClientFile } from '#app/istore.js';
import type { MemberWithPermission } from '#shared/types/entityPermisions.js';
import type { EntityWithFilesSchema } from '#shared/types/entityType.js';
import type { FileType } from '#shared/types/fileType.js';
import type { PermissionsDataSchema } from '#shared/types/permissionType.js';
import type { Entity } from '#V2/api/entities/types.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

type PersistedEntityFile = FileType & { _id: string };
type EntitySaveDocument = PersistedEntityFile | ClientBlobFile;
type EntitySaveAttachment = PersistedEntityFile | ClientFile;
type EntitySaveInput = Omit<EntityWithFilesSchema, 'documents' | 'attachments'> & {
  documents?: EntitySaveDocument[];
  attachments?: EntitySaveAttachment[];
};

type EntityReadOptions = ServiceRequestOptions & {
  language: string;
  omitRelationships?: boolean;
};

/**
 * Entities domain service.
 *
 * Standard reads: `getById`, `getBySharedId`.
 * Standard writes: `upsert`, `delete`.
 * Access control: `getPermissions`, `savePermissions`, `searchCollaborators`.
 * (`getAll` is search-scoped elsewhere; entities are not listed like thesauri.)
 */
interface EntitiesService {
  getById(id: string, options: EntityReadOptions): Promise<ApiResponse<Entity | undefined>>;
  getBySharedId(
    sharedId: string,
    options: EntityReadOptions
  ): Promise<ApiResponse<Entity[] | undefined>>;
  upsert(
    entity: EntitySaveInput,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<Entity | undefined>>;
  delete(sharedIds: string[], options?: ServiceRequestOptions): Promise<ApiResponse<void>>;
  getPermissions(
    sharedIds: string[],
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<MemberWithPermission[]>>;
  savePermissions(
    data: PermissionsDataSchema,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<PermissionsDataSchema>>;
  searchCollaborators(
    term: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<MemberWithPermission[]>>;
}

export type { EntitiesService, EntityReadOptions, EntitySaveInput };
