import { Job } from '../contracts/Job';

export interface JobConstructor<T extends Job> {
  new (...args: any[]): T;
}

export interface Definition<T extends Job> {
  constructorFn: JobConstructor<T>;
  dependenciesFactory?: (namespace: string) => Promise<Partial<T>>;
}

export type Definitions = Record<string, Definition<any>>;

export interface JobSerializer {
  serialize(job: Job, namespace: string): Promise<string>;
  deserialize(id: string, serialized: string, definitions: Definitions): Promise<Job>;
}
