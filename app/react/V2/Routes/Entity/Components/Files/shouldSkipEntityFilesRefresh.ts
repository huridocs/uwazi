type SkipEntityFilesRefreshInput = {
  isFileEditing: boolean;
  isMetadataEditing: boolean;
  isMetadataDirty: boolean;
};

const shouldSkipEntityFilesRefresh = ({
  isFileEditing,
  isMetadataEditing,
  isMetadataDirty,
}: SkipEntityFilesRefreshInput): boolean => isFileEditing || isMetadataEditing || isMetadataDirty;

export { shouldSkipEntityFilesRefresh };
export type { SkipEntityFilesRefreshInput };
