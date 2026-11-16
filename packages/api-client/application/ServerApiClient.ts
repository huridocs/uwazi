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
};
