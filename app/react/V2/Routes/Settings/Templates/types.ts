import { ClientTemplateSchema } from 'app/istore';
import { PropertySchema } from 'shared/types/commonTypes';

type TemplateRow = ClientTemplateSchema & {
  rowId: string;
  translation?: React.ReactNode;
};

type PropertyRow = PropertySchema & {
  rowId: string;
  disableRowDnD?: boolean;
  disableRowSelection?: boolean;
};

export type { PropertyRow, TemplateRow };
