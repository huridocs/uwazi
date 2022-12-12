export interface FilesDataSource {
  filesExistForEntities(files: { entity: string; _id: string }[]): Promise<boolean>;
}
