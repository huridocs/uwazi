import type {
  DatavizDataDTO,
  DatavizDefinition,
  DatavizQuery,
} from '#V2/Dataviz/types/index.js';

export type DatavizPreviewInput = {
  id: string;
  query: DatavizQuery;
};

export type DatavizApiOptions = {
  dataDelayMs?: number;
  saveDelayMs?: number;
};

export type DatavizApi = {
  getDefinition: (id: string) => Promise<DatavizDefinition>;
  saveDefinition: (definition: DatavizDefinition) => Promise<DatavizDefinition>;
  deleteDefinition: (id: string) => Promise<void>;
  getData: (input: DatavizPreviewInput) => Promise<DatavizDataDTO>;
  refreshSnapshot: (id: string) => Promise<DatavizDataDTO>;
};
