import { Template } from 'app/apiResponseTypes';

const filterPXQualifiedTemplates = (template: Template) =>
  template.properties?.some(({ type }) => type === 'markdown') &&
  template.properties?.some(({ type }) => type === 'numeric');

export { filterPXQualifiedTemplates };
