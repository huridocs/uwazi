export interface HubDataSource {
  exists(): Promise<boolean>;
  create(): Promise<void>;
  drop(): Promise<void>;
  insertIds(ids: string[]): Promise<void>;
}
