/** @format */
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

/**
 * A given template property may refer to an existing thesaurus to provide
 * multi-select values. This function resolves a template property name that
 * refers to a particular thesaurus.
 */
export function resolveTemplateProp(thesaurus: ThesaurusSchema, templates: TemplateSchema[]) {
  let matchingProp;
  for (let i = 0; i < templates.length; i += 1) {
    const template = templates[i];
    const matchProp = template.properties?.find((prop: any) => prop.content === thesaurus._id);
    if (matchProp !== undefined) {
      matchingProp = matchProp;
      // TODO: Consider supporting multiple fields referring to the same thesaurus.
      break;
    }
  }
  return matchingProp;
}
