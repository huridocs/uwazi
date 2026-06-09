import { TaskStatus } from '#shared/tasks/tasks.js';
import { IXModelType } from '#shared/types/IXModelType.js';
import { LabelCountSchema } from '#app/Thesauri/types/labelCountType.js';
import { IImmutable } from '#shared/types/Immutable.js';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import { PropertySelectionSchema, PropertySchema } from '#shared/types/commonTypes.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { ConnectionSchema } from '#shared/types/connectionType.js';
import { ClientUserSchema, ClientUserGroupSchema, ClientSettings } from '#app/apiResponseTypes.js';
import { FileType } from '#shared/types/fileType.js';
import { PageType } from '#shared/types/pageType.js';
import { TranslationContext, TranslationType } from '#shared/translationType.js';
import { ClientIXExtractorType } from '#V2/shared/types.js';

interface InstanceStats {
  users: { total: number; admin: number; editor: number; collaborator: number };
  entities: { total: number };
  files: { total: number };
  storage: { total: number };
}
interface EntityDisplayState {
  documents: IImmutable<{ rows: EntitySchema[] }>;
  ui: IImmutable<{
    selectedDocuments: EntitySchema[];
    tableViewColumns: TableViewColumn[];
    zoomLevel: number;
    filtersPanel: boolean;
  }>;
  sidepanel: {
    metadata: ClientEntitySchema;
    quickLabelState: IImmutable<QuickLabelState>;
    quickLabelMetadata: QuickLabelMetadata;
    quickLabelMetadataForm: any;
  };
  search: any;
  filters: IImmutable<{ documentTypes: [] }>;
  selectedSorting: string;
}

interface RelationshipTypesType {
  _id: string;
  name: string;
}

interface ClientTranslationContextSchema extends Omit<TranslationContext, 'values'> {
  values: { [key: string]: string };
}

interface InlineEdit {
  inlineEdit: boolean;
  context: string;
  key: string;
  showInlineEditForm: string;
}

export interface ClientTranslationSchema extends Omit<TranslationType, 'contexts'> {
  contexts: ClientTranslationContextSchema[];
  locale: string;
}

export interface ClientPropertySchema extends PropertySchema {
  localID?: string;
  inserting?: boolean;
}
export interface TasksState {
  SyncState?: TaskStatus;
  TrainState?: TaskStatus;
}

export interface QuickLabelState {
  thesaurus?: string;
  autoSave?: boolean;
}

export interface TriStateSelectValue {
  // Thesaurus value ids that should be added to all entities.
  added: string[];
  // Thesaurus value ids that should be removed from all entities.
  removed: string[];
  // Thesaurus value ids that all entities originally had.
  originalFull: string[];
  // Thesaurus value ids that some, but not all, entities originally had.
  originalPartial: string[];
}

export interface QuickLabelMetadata {
  [k: string]: TriStateSelectValue;
}

export interface ThesaurusSuggestions {
  property?: PropertySchema;
  model?: IXModelType;
  docsWithLabels?: LabelCountSchema;
  docsWithSuggestionsForPublish?: LabelCountSchema;
  docsWithSuggestionsForReview?: LabelCountSchema;
}

export interface OneUpState {
  loaded: boolean;
  fullEdit: boolean;
  loadConnections: boolean;
  indexInDocs: number;
  totalDocs: number;
  maxTotalDocs: number;
  requestHeaders: Object;
  reviewThesaurusName: string | null;
  reviewThesaurusId: string | null;
  reviewThesaurusValues: string[];
}

export interface TableViewColumn extends PropertySchema {
  hidden: boolean;
  translationContext?: string;
}
export interface ClientTemplateSchema extends TemplateSchema {
  _id: string;
  properties: ClientPropertySchema[];
  commonProperties?: [ClientPropertySchema, ...ClientPropertySchema[]];
}

export interface ClientFile extends FileType {
  _id: string;
  serializedFile?: string;
  fileLocalID?: string;
}

export interface ClientBlobFile extends FileType {
  data: string;
  originalFile: File;
  originalName?: string;
}

export interface ClientEntitySchema extends EntitySchema {
  documents?: (ClientFile | ClientBlobFile)[];
  attachments?: ClientFile[];
  defaultDoc?: ClientFile;
}

export interface DocumentViewerUiStateReference {
  sourceRange: { text: string; selectionRectangles: [] };
  sourceFile: string;
}

export interface IStore {
  library: EntityDisplayState;
  uploads: EntityDisplayState;
  template: {
    data: TemplateSchema;
  };
  templates: IImmutable<ClientTemplateSchema[]>;
  thesauris: IImmutable<ThesaurusSchema[]>;
  thesauri: {
    thesaurus: IImmutable<ThesaurusSchema>;
    suggestInfo: IImmutable<ThesaurusSuggestions>;
    tasksState: IImmutable<TasksState>;
  };
  relationships: any;
  entityView: {
    entity: IImmutable<ClientEntitySchema>;
    entityFormState: any;
    entityForm: any;
    uiState: IImmutable<{ tab: string }>;
  };
  documentViewer: {
    references: IImmutable<ConnectionSchema[]>;
    targetDocReferences: IImmutable<ConnectionSchema[]>;
    doc: IImmutable<ClientEntitySchema>;
    targetDoc: IImmutable<ClientEntitySchema>;
    uiState: IImmutable<{
      reference: DocumentViewerUiStateReference;
      activeReference: string;
      activeReferences: string[];
      enableClickAction?: boolean;
    }>;
    metadataExtraction: IImmutable<{
      selections: PropertySelectionSchema[];
    }>;
    sidepanel: {
      metadata: ClientEntitySchema;
    };
    documentScale: number;
  };
  oneUpReview: {
    state?: IImmutable<OneUpState>;
  };
  settings: {
    collection: IImmutable<ClientSettings>;
    stats?: IImmutable<InstanceStats>;
  };
  user: IImmutable<ClientUserSchema>;
  users: IImmutable<ClientUserSchema[]>;
  userGroups: IImmutable<ClientUserGroupSchema[]>;
  page: {
    pageView: IImmutable<PageType & { scriptRendered?: boolean }>;
    itemLists: IImmutable<unknown[]>;
    error: IImmutable<Record<string, unknown>>;
    datasets: IImmutable<{
      [name: string]: { rows: any[]; totalRows: number; aggregations: any };
    }>;
    data: PageType;
    uiState: IImmutable<{ savingPage: boolean }>;
    formState: any;
  };
  pages: IImmutable<PageType>;
  relationTypes: IImmutable<RelationshipTypesType[]>;
  translations: IImmutable<ClientTranslationSchema[]>;
  inlineEdit: IImmutable<InlineEdit>;
  locale: string;
  ixExtractors: Immutable<ClientIXExtractorType[]>;
}
