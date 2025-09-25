import { ClientTemplateSchema, ClientProperty } from '#shared/types.js';

type TemplateRow = ClientTemplateSchema & {
  rowId: string;
  translation?: React.ReactNode;
};

type PropertyRow = ClientProperty & {
  rowId: string;
  disableRowDnD?: boolean;
  disableRowSelection?: boolean;
};

export type { PropertyRow, TemplateRow };
