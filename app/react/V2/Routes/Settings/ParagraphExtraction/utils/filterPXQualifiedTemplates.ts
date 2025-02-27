import { Template } from 'app/apiResponseTypes';

const filterPXQualifiedTemplates = (template: Template) =>
  template.properties?.some(({ name }) => name === 'rich_text') &&
  template.properties?.some(({ name }) => name === 'numeric_text');

export { filterPXQualifiedTemplates };
