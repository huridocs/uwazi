import type { DatavizDataDTO, DatavizDefinition } from '#V2/Dataviz/types/index.js';

export type DatavizApiOptions = {
  dataDelayMs?: number;
  saveDelayMs?: number;
};

export type DatavizApi = {
  getDefinition: (id: string) => Promise<DatavizDefinition>;
  saveDefinition: (definition: DatavizDefinition) => Promise<DatavizDefinition>;
  deleteDefinition: (id: string) => Promise<void>;
  getData: (definition: DatavizDefinition) => Promise<DatavizDataDTO>;
};
