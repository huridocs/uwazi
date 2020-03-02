import { propertyTypes } from 'shared/propertyTypes';
import { TemplateSchema } from './types/templateType';

export function convertThesaurusName(thesaurusName: string) {
  return `${thesaurusName.toLowerCase().replace(/[^0-9a-z]/g, '')}`;
}

/* Convert Uwazi concepts into their Topic Classification model equivalent. */
export function buildFullModelName(thesaurusName: string) {
  return `${process.env.DATABASE_NAME}-${convertThesaurusName(thesaurusName)}`;
}

/* Find all property names using this thesaurus */
export function getThesaurusPropertyNames(
  thesaurusId: string,
  templates: TemplateSchema[]
): string[] {
  const propNames: { [k: string]: boolean } = {};
  templates.forEach(t =>
    t.properties?.forEach(p => {
      if (
        p.name &&
        [propertyTypes.select, propertyTypes.multiselect].includes(p.type) &&
        p.content === thesaurusId
      ) {
        propNames[p.name] = true;
      }
    })
  );
  return Object.keys(propNames);
}
