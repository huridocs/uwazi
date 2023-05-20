import { Job } from '../contracts/Job';

interface Constructor<T extends Job> {
  new (...args: any[]): T;
}

export interface Definition<T extends Job> {
  constructorFn: Constructor<T>;
  dependenciesFactory?: (namespace: string) => Promise<Partial<T>>;
}

export type Definitions = Record<string, Definition<any>>;

export interface NamespaceFactory {
  (job: Job): Promise<string>;
}

export interface JobSerializer {
  serialize(job: Job, namespaceFactory?: NamespaceFactory): Promise<string>;
  deserialize(id: string, serialized: string, definitions: Definitions): Promise<Job>;
}
