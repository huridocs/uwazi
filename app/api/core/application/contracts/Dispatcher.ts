import { LanguageISO6391 } from '#shared/types/commonTypes.js';

type SyncRelationshipsParams = {
  sharedId: string;
  targetLanguage: LanguageISO6391;
  templateId: string;
  tenantName: string;
  userId: string;
};

type CleanupEntityParams = {
  sharedIds: string[];
  userId: string;
  tenantName: string;
};

type PDFPostProcessParams = {
  tenantName: string;
  documentId: string;
  userId: string;
};

type TemplatePostProcessParams = {
  entitiesIds: string[];
  templateId: string;
  language: string;
  modifiedRelationshipsProps: string[];
  newGeneratedIdProps: string[];
  deletedProperties: string[];
  renamedProperties: { [oldName: string]: string };
  fullReindex: boolean;
  resaveForFilterChange: boolean;
  tenantName: string;
  userId: string;
};

type DenormalizeThesaurusParams = {
  tenantName: string;
  thesaurusId: string;
  userId: string;
};

type CloneLanguageEntitiesParams = {
  pairs: { from: LanguageISO6391; to: LanguageISO6391 }[];
};

type DeleteLanguageEntitiesParams = {
  language: LanguageISO6391;
};

type SendWelcomeEmailParams = {
  domain: string;
  userId: string;
};

interface Dispatcher {
  syncRelationships(items: SyncRelationshipsParams[]): Promise<void>;
  cleanupEntities(chunks: CleanupEntityParams[]): Promise<void>;
  postProcessPDFs(items: PDFPostProcessParams[]): Promise<void>;
  deleteFilesFromStorage(paths: string[]): Promise<void>;
  postProcessTemplateEntities(
    callback: (dispatch: (params: TemplatePostProcessParams) => void) => void | Promise<void>
  ): Promise<void>;
  denormalizeThesaurus(params: DenormalizeThesaurusParams): Promise<void>;
  cloneLanguageEntities(params: CloneLanguageEntitiesParams): Promise<void>;
  deleteLanguageEntities(params: DeleteLanguageEntitiesParams): Promise<void>;
  sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<void>;
}

export type {
  Dispatcher,
  SyncRelationshipsParams,
  CleanupEntityParams,
  PDFPostProcessParams,
  TemplatePostProcessParams,
  DenormalizeThesaurusParams,
  CloneLanguageEntitiesParams,
  DeleteLanguageEntitiesParams,
};
