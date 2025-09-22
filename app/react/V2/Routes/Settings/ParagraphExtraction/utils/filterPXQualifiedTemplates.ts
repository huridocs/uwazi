import { Template } from '../../apiResponseTypes.js';

const filterPXQualifiedTemplates = (template: Template) =>
  template.properties?.some(({ type }) => type === 'markdown') &&
  template.properties?.some(({ type }) => type === 'numeric');

export { filterPXQualifiedTemplates };
