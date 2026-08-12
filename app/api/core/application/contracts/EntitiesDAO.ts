import { LanguageISO6391, ObjectIdSchema } from '#shared/types/commonTypes.js';
import { LocalizedLabels } from '#shared/types/datavizSchema.js';
import { FileType } from '#shared/types/fileType.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';

type MetadataCriteria = {
  property: string;
  exists?: boolean;
  nonEmpty?: boolean;
  hasValues?: boolean;
};

/**
 * DB-agnostic entity query filters. No Mongo operators, no ObjectId —
 * implementations translate these into backend-specific conditions.
 */
type EntityFilters = {
  _id?: string;
  ids?: string[];
  sharedId?: string;
  sharedIds?: string[];
  language?: string;
  languages?: string[];
  template?: string;
  templateIds?: string[];
  languagePairs?: { sharedId: string; language: string }[];
  idRange?: { from?: string; to?: string };
  title?: string;
  titleNotEmpty?: boolean;
  published?: boolean;
  metadataValueIn?: { property: string; value: string }[];
  metadata?: MetadataCriteria[];
};

type FindOptions = {
  select?: string[];
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
};

type GetByIdsWithDocumentsOptions = {
  limit?: number;
  documentsFullText?: boolean;
};

type GetWithFilesMatch = {
  language?: LanguageISO6391;
  sharedId?: string;
  sharedIds?: string[];
  published?: boolean;
};

type LabelInfo = {
  sharedId: string;
  title: string;
  icon: EntityDBO['icon'];
};

type EntityFile = FileType & { _id: ObjectIdSchema };

type EntityWithFiles = EntityDBO & { documents: EntityFile[]; attachments: EntityFile[] };

/**
 * Main entities DAO contract. Permission enforcement is safe by default:
 * every read/write is filtered by the access context the implementation was
 * constructed with. Use `unrestricted()` to obtain a view that bypasses
 * permission enforcement (system access context).
 */
interface EntitiesDAO {
  unrestricted(): EntitiesDAO;

  find(filters?: EntityFilters, options?: FindOptions): Promise<EntityDBO[]>;
  findOne(filters?: EntityFilters, options?: FindOptions): Promise<EntityDBO | null>;
  count(filters?: EntityFilters): Promise<number>;
  getIds(filters?: EntityFilters): Promise<string[]>;

  getWithFiles(match: GetWithFilesMatch): Promise<EntityWithFiles[]>;
  getByIdsWithDocuments(
    ids: string[],
    options?: GetByIdsWithDocumentsOptions
  ): Promise<EntityWithFiles[]>;

  getBySharedId(sharedId: string, language?: LanguageISO6391): Promise<EntityDBO | null>;
  getByInternalId(id: string, projection?: Record<string, number>): Promise<EntityDBO | null>;
  findBySharedIds(sharedIds: string[], language?: LanguageISO6391): Promise<EntityDBO[]>;

  countByTemplate(templateId: string): Promise<number>;
  countDistinctSharedIds(): Promise<number>;

  getSharedIdLabelInfo(sharedIds: string[], language: string): Promise<LabelInfo[]>;
  getTitleLabelsBySharedIds(
    sharedIds: string[],
    languages: LanguageISO6391[]
  ): Promise<Map<string, LocalizedLabels>>;

  cloneForLanguage(
    from: LanguageISO6391,
    to: LanguageISO6391,
    onBatch?: (clonedEntities: Omit<EntityDBO, '_id'>[]) => Promise<void>
  ): Promise<void>;
  deleteByLanguage(
    language: LanguageISO6391,
    onBatch?: (sharedIds: string[]) => Promise<void>
  ): Promise<void>;
}

export type {
  EntityFile,
  EntityFilters,
  EntityWithFiles,
  FindOptions,
  GetByIdsWithDocumentsOptions,
  GetWithFilesMatch,
  LabelInfo,
  MetadataCriteria,
};
export type { EntitiesDAO };
