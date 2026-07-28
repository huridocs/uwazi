type MetadataEditingHost = 'main' | 'side';

const resolveActiveTabId = (atomId: string | undefined, urlId?: string) => atomId || urlId;

const resolveFormMountHost = (
  mainMetadataActive: boolean,
  sideMetadataActive: boolean,
  lastMetadataAnchor: MetadataEditingHost | null
): MetadataEditingHost | null => {
  if (lastMetadataAnchor === 'main' && mainMetadataActive) return 'main';
  if (lastMetadataAnchor === 'side' && sideMetadataActive) return 'side';
  if (mainMetadataActive && !sideMetadataActive) return 'main';
  if (sideMetadataActive && !mainMetadataActive) return 'side';
  return lastMetadataAnchor;
};

const keepMetadataTab = (
  metadataActive: boolean,
  isEditing: boolean,
  formMountHost: MetadataEditingHost | null,
  host: MetadataEditingHost
) => metadataActive || (isEditing && formMountHost === host);

export { resolveActiveTabId, resolveFormMountHost, keepMetadataTab };
export type { MetadataEditingHost };
