import { TaskStatus } from 'shared/tasks/tasks';
import { ClassifierModelSchema } from 'app/Thesauri/types/classifierModelType';
import { LabelCountSchema } from 'app/Thesauri/types/labelCountType';
import { IImmutable } from 'shared/types/Immutable';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { EntitySchema } from 'api/entities/entityType';

export interface TaskState {
  SyncState?: TaskStatus;
  TrainState?: TaskStatus;
}

export interface MultiEditOpts {
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

export interface MultiEditState {
  [k: string]: TriStateSelectValue;
}

export interface SuggestInfo {
  property: PropertySchema;
  model: ClassifierModelSchema;
  docsWithLabels: LabelCountSchema;
  docsWithSuggestionsForPublish: LabelCountSchema;
  docsWithSuggestionsForReview: LabelCountSchema;
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

export interface IStore {
  library: {
    documents: IImmutable<{ rows: EntitySchema[] }>;
    ui: IImmutable<{
      selectedDocuments: EntitySchema[];
    }>;
    sidepanel: {
      multiEditOpts: IImmutable<MultiEditOpts>;
      multipleEdit: MultiEditState;
      multipleEditForm: any;
    };
  };
  templates: IImmutable<TemplateSchema[]>;
  thesauris: IImmutable<ThesaurusSchema[]>;
  thesauri: {
    thesaurus: IImmutable<ThesaurusSchema>;
    suggestInfo: IImmutable<SuggestInfo>;
    taskState: IImmutable<TaskState>;
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
}
