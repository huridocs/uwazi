type Option = { id?: string; label: string; value: string; disabled?: boolean };
type ContextOption = Option & { selected: boolean };

export type { Option, ContextOption };
