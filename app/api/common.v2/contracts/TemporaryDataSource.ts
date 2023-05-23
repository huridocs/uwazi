export interface TemporaryDataSource<DbSchema> {
  name(): string;
  exists(): Promise<boolean>;
  create(): Promise<void>;
  drop(): Promise<void>;
}
