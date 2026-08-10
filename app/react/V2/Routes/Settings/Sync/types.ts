type SyncTemplateConfig = {
  properties: string[];
  filter?: string;
  attachments?: boolean;
};

type SyncStatus = {
  name: string;
  pendingChanges: number;
  lastSyncs: Record<string, number>;
};

type SyncConfigPublic = {
  url: string;
  name: string;
  active?: boolean;
  config: {
    templates?: {
      [templateId: string]: SyncTemplateConfig | undefined;
    };
    relationtypes?: string[];
  };
  status?: SyncStatus;
};

type SyncConfigForm = SyncConfigPublic & {
  username?: string;
  password?: string;
};

export type { SyncTemplateConfig, SyncStatus, SyncConfigPublic, SyncConfigForm };
