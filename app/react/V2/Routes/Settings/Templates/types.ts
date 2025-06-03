import { ClientTemplateSchema } from 'app/istore';

export type TemplateRow = ClientTemplateSchema & {
  rowId: string;
  translation?: React.ReactNode;
};
