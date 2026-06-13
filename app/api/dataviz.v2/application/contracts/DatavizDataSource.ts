import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { ResultType } from '#api/core/libs/Result.js';

export interface DatavizDataSource {
  create(dataviz: Dataviz): Promise<void>;
  update(dataviz: Dataviz): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<ResultType<Dataviz, Error>>;
  list(): Promise<Dataviz[]>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  setProcessing(id: string, processing: Dataviz['processing']): Promise<void>;
}
