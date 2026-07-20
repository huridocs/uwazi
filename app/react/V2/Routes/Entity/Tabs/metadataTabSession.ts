import type { MetadataEditingHost } from '../Components/context/index.js';

const resolveActiveTabId = (atomId: string | undefined, urlId?: string) => atomId || urlId;

const keepMetadataTab = (
  metadataActive: boolean,
  isEditing: boolean,
  editingHost: MetadataEditingHost | null,
  host: MetadataEditingHost
) => metadataActive || (isEditing && editingHost === host);

const isMetadataHostDirty = (
  isDirty: boolean,
  editingHost: MetadataEditingHost | null,
  host: MetadataEditingHost
) => isDirty && editingHost === host;

export { resolveActiveTabId, keepMetadataTab, isMetadataHostDirty };
