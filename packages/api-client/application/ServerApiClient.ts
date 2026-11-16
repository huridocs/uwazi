import type { ActivityLogQuery, ActivityLogResponse } from './contracts/ActivityLog.js';
import type { DatavizDefinitionResponse, DatavizListResponse } from './contracts/Dataviz.js';
import type { EntitiesResponse, EntityQuery } from './contracts/Entities.js';
import type { PageQuery, PageResponse, PagesQuery, PagesResponse } from './contracts/Pages.js';
import type {
  PXEntityParagraphsQuery,
  PXEntityParagraphsResponse,
  PXExtractorsResponse,
  PXExtractorStatusesQuery,
  PXExtractorStatusesResponse,
} from './contracts/ParagraphExtraction.js';
import type {
  RelationshipsAnchorsQuery,
  RelationshipsAnchorsResponse,
  RelationshipsSummaryQuery,
  RelationshipsSummaryResponse,
} from './contracts/Relationships.js';
import type { RelationshipTypesResponse } from './contracts/RelationshipTypes.js';
import type { SettingsLinksResponse, SettingsResponse } from './contracts/Settings.js';
import type { TemplatesResponse } from './contracts/Templates.js';
import type { ThesauriQuery, ThesauriResponse } from './contracts/Thesauri.js';
import type {
  LegacyTranslationsQuery,
  LegacyTranslationsResponse,
  TranslationEntriesResponse,
} from './contracts/Translations.js';
import type { UserGroupsResponse } from './contracts/UserGroups.js';
import type { CurrentUserResponse, UsersResponse } from './contracts/Users.js';

interface SettingsResource {
  get(): Promise<SettingsResponse>;
  getLinks(): Promise<SettingsLinksResponse>;
}

interface TemplatesResource {
  getAll(): Promise<TemplatesResponse>;
}

interface ThesauriResource {
  getAll(query?: ThesauriQuery): Promise<ThesauriResponse>;
}

interface RelationshipTypesResource {
  getAll(): Promise<RelationshipTypesResponse>;
}

interface TranslationsResource {
  getLegacy(query?: LegacyTranslationsQuery): Promise<LegacyTranslationsResponse>;
  getEntries(): Promise<TranslationEntriesResponse>;
}

interface UsersResource {
  getAll(): Promise<UsersResponse>;
  getCurrent(): Promise<CurrentUserResponse>;
}

interface UserGroupsResource {
  getAll(): Promise<UserGroupsResponse>;
}

interface EntitiesResource {
  get(query: EntityQuery): Promise<EntitiesResponse>;
}

interface RelationshipsResource {
  getSummary(query: RelationshipsSummaryQuery): Promise<RelationshipsSummaryResponse>;
  getAnchors(query: RelationshipsAnchorsQuery): Promise<RelationshipsAnchorsResponse>;
}

interface PagesResource {
  list(query?: PagesQuery): Promise<PagesResponse>;
  get(query: PageQuery): Promise<PageResponse>;
}

interface DatavizResource {
  list(): Promise<DatavizListResponse>;
  getById(id: string): Promise<DatavizDefinitionResponse>;
}

interface ParagraphExtractionResource {
  getExtractors(): Promise<PXExtractorsResponse>;
  getExtractorStatuses(query: PXExtractorStatusesQuery): Promise<PXExtractorStatusesResponse>;
  getEntityParagraphs(query: PXEntityParagraphsQuery): Promise<PXEntityParagraphsResponse>;
}

interface ActivityLogResource {
  list(query?: ActivityLogQuery): Promise<ActivityLogResponse>;
}

/**
 * Typed, resource-grouped access to the API from server-side rendering. Every method answers what
 * the matching GET endpoint would send over HTTP, as the page's user, and rejects with a
 * ServerApiError whenever that endpoint would answer with an error status.
 */
interface ServerApiClient {
  settings: SettingsResource;
  templates: TemplatesResource;
  thesauri: ThesauriResource;
  relationshipTypes: RelationshipTypesResource;
  translations: TranslationsResource;
  users: UsersResource;
  userGroups: UserGroupsResource;
  entities: EntitiesResource;
  relationships: RelationshipsResource;
  pages: PagesResource;
  dataviz: DatavizResource;
  paragraphExtraction: ParagraphExtractionResource;
  activityLog: ActivityLogResource;
}

export type {
  ServerApiClient,
  SettingsResource,
  TemplatesResource,
  ThesauriResource,
  RelationshipTypesResource,
  TranslationsResource,
  UsersResource,
  UserGroupsResource,
  EntitiesResource,
  RelationshipsResource,
  PagesResource,
  DatavizResource,
  ParagraphExtractionResource,
  ActivityLogResource,
};
