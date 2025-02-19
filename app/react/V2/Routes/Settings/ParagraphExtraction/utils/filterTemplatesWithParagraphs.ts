import { Template } from 'app/apiResponseTypes';

const filterTemplatesWithParagraphs = (template: Template) =>
  template.properties?.some(({ name }) => name === 'rich_text');

export { filterTemplatesWithParagraphs };
