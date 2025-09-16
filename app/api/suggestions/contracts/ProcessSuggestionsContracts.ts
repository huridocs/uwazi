// Shared contracts for process suggestions use case and adapters

export const PROCESS_MODES = ['process_extractor', 'process_selected'] as const;
export type ProcessMode = (typeof PROCESS_MODES)[number];

export const AUTO_ACCEPT_SOURCES = ['previous', 'all'] as const;
export type AutoAcceptSource = (typeof AUTO_ACCEPT_SOURCES)[number];

export const OVERWRITE_MODES = ['blank_only', 'overwrite_all'] as const;
export type OverwriteMode = (typeof OVERWRITE_MODES)[number];

export type ProcessFindFilters = {
  nonProcessed?: boolean;
  obsolete?: boolean;
  error?: boolean;
};
