type Option = {
  id?: string;
  label: string | React.ReactNode;
  value: string;
  disabled?: boolean;
};
type ContextOption = Option & { selected: boolean };

export type { Option, ContextOption };
