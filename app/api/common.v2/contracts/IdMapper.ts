export interface IdMapper<DbType> {
  mapToDb: (id: string) => DbType;
  mapToApp: (id: DbType) => string;
}
