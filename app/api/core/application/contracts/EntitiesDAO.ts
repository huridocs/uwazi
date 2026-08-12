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
 *
 * Only "boring" filters live here: equality/IN and trivial predicates that
 * compose freely across find/findOne/count/getIds and translate cheaply on
 * both backends. Semantically distinct query shapes (language pairs, id
 * ranges, metadata shape criteria) are promoted to named methods.
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
  title?: string;
  titleNotEmpty?: boolean;
  published?: boolean;
  /**
   * OR-match on (property, value) presence in metadata. Kept in the bag
   * because indexing needs it through getIds() and count() as well as find().
   */
  metadataValueIn?: { property: string; value: string }[];
};

type LanguagePair = { sharedId: string; language: string };

/** OR-match on (sharedId, language) tuples. Pairs must be non-empty. */
type FindByLanguagePairsQuery = { pairs: LanguagePair[] };

/**
 * Inclusive range scan on _id (hex strings) within a template.
 * Template is required: encodes the invariant that _id range scans are
 * always template-scoped (bulk batch jobs), preventing unbounded scans.
 */
type FindByTemplateIdRangeQuery = {
  templateId: string;
  from?: string;
  to?: string;
  language?: string;
};

/**
 * AND-composed metadata shape checks (exists / nonEmpty / hasValues),
 * anchored to optional boring filters (templateIds, titleNotEmpty, ...).
 */
type FindByMetadataCriteriaQuery = {
  criteria: MetadataCriteria[];
  filters?: EntityFilters;
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

  findByLanguagePairs(query: FindByLanguagePairsQuery, options?: FindOptions): Promise<EntityDBO[]>;
  findByTemplateIdRange(
    query: FindByTemplateIdRangeQuery,
    options?: FindOptions
  ): Promise<EntityDBO[]>;
  findByMetadataCriteria(
    query: FindByMetadataCriteriaQuery,
    options?: FindOptions
  ): Promise<EntityDBO[]>;

  getWithFiles(match: GetWithFilesMatch): Promise<EntityWithFiles[]>;
  getByIdsWithDocuments(
    ids: string[],
    options?: GetByIdsWithDocumentsOptions
  ): Promise<EntityWithFiles[]>;

  /** Returns all language variants when no language is given; the specific variant (or null) when language is provided. */
  getBySharedId(sharedId: string): Promise<EntityDBO[]>;
  getBySharedId(sharedId: string, language: LanguageISO6391): Promise<EntityDBO | null>;
  getByInternalId(id: string, projection?: Record<string, number>): Promise<EntityDBO | null>;

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
  FindByLanguagePairsQuery,
  FindByMetadataCriteriaQuery,
  FindByTemplateIdRangeQuery,
  FindOptions,
  GetByIdsWithDocumentsOptions,
  GetWithFilesMatch,
  LabelInfo,
  LanguagePair,
  MetadataCriteria,
};
export type { EntitiesDAO };
