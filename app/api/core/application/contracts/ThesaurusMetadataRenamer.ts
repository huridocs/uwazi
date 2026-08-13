export interface ThesaurusMetadataRenamer {
  renameInMetadata(
    valueId: string,
    newLabel: string,
    thesaurusId: string,
    language: string
  ): Promise<void>;
}
