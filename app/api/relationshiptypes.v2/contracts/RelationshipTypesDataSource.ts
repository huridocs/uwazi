export interface RelationshipTypesDataSource {
  typesExist(ids: string[]): Promise<boolean>;
}
