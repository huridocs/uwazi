import { TaskStatus } from 'shared/tasks/tasks';
import { ClassifierModelSchema } from 'app/Thesauri/types/classifierModelType';
import { LabelCountSchema } from 'app/Thesauri/types/labelCountType';
import { IImmutable } from 'shared/types/Immutable';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { EntitySchema } from 'shared/types/entityType';

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
  model?: ClassifierModelSchema;
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

export interface SettingsState {
  features?: { topicClassification: boolean };
}

export interface TableViewColumn extends Omit<PropertySchema, 'name'> {
  hidden: boolean;
  translationContext?: string;
  name?: string;
}

interface EntityDisplayState {
  documents: IImmutable<{ rows: EntitySchema[] }>;
  ui: IImmutable<{
    selectedDocuments: EntitySchema[];
    tableViewColumns: TableViewColumn[];
    zoomLevel: number;
  }>;
  sidepanel: {
    quickLabelState: IImmutable<QuickLabelState>;
    quickLabelMetadata: QuickLabelMetadata;
    quickLabelMetadataForm: any;
  };
  search: any;
}

interface ClientTemplateSchema extends TemplateSchema {
  _id: string;
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
    entity: IImmutable<EntitySchema>;
    entityFormState: any;
    entityForm: any;
    uiState: IImmutable<{ tab: string }>;
  };
  oneUpReview: {
    state?: IImmutable<OneUpState>;
  };
  settings: {
    collection: IImmutable<SettingsState>;
  };
}
