import { getFieldName } from '#V2/Routes/Entity/Components/search/searchUtils.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';

const fieldLabel = (field: string, fieldKey: string, template?: ClientTemplateSchema) =>
  getFieldName(field, template) || fieldKey;

export { fieldLabel };
