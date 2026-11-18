import type { Request } from 'express';

import type { ServerApiClient } from '../application/ServerApiClient.js';
import { ControllerInvoker } from './ControllerInvoker.js';
import { ActivityLogClient } from './resources/ActivityLogClient.js';
import { DatavizClient } from './resources/DatavizClient.js';
import { EntitiesClient } from './resources/EntitiesClient.js';
import { PagesClient } from './resources/PagesClient.js';
import { ParagraphExtractionClient } from './resources/ParagraphExtractionClient.js';
import { RelationshipsClient } from './resources/RelationshipsClient.js';
import { RelationshipTypesClient } from './resources/RelationshipTypesClient.js';
import { SettingsClient } from './resources/SettingsClient.js';
import { TemplatesClient } from './resources/TemplatesClient.js';
import { ThesauriClient } from './resources/ThesauriClient.js';
import { TranslationsClient } from './resources/TranslationsClient.js';
import { UserGroupsClient } from './resources/UserGroupsClient.js';
import { UsersClient } from './resources/UsersClient.js';

/** Builds the client for one server-rendered page; every call acts as that page's user. */
function createServerApiClient(pageRequest: Request): ServerApiClient {
  const invoker = new ControllerInvoker(pageRequest);

  return {
    settings: new SettingsClient(invoker),
    templates: new TemplatesClient(invoker),
    thesauri: new ThesauriClient(invoker),
    relationshipTypes: new RelationshipTypesClient(invoker),
    translations: new TranslationsClient(invoker),
    users: new UsersClient(invoker),
    userGroups: new UserGroupsClient(invoker),
    entities: new EntitiesClient(invoker),
    relationships: new RelationshipsClient(invoker),
    pages: new PagesClient(invoker),
    dataviz: new DatavizClient(invoker),
    paragraphExtraction: new ParagraphExtractionClient(invoker),
    activityLog: new ActivityLogClient(invoker),
  };
}

export { createServerApiClient };
