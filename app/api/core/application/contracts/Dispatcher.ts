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
  tenantName: string;
  userId: string;
};

interface Dispatcher {
  syncRelationships(items: SyncRelationshipsParams[]): Promise<void>;
  cleanupEntities(chunks: CleanupEntityParams[]): Promise<void>;
  postProcessPDFs(items: PDFPostProcessParams[]): Promise<void>;
  deleteFilesFromStorage(paths: string[]): Promise<void>;
  postProcessTemplateEntities(items: TemplatePostProcessParams[]): Promise<void>;
}

export type {
  Dispatcher,
  SyncRelationshipsParams,
  CleanupEntityParams,
  PDFPostProcessParams,
  TemplatePostProcessParams,
};
