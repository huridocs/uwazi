import type { PropertyInput, TemplateInput } from './contracts/TemplateInput.js';
import type { PropertyMatches, TemplateDuplicate } from './contracts/PropertyMatches.js';
import { DomainPropertyMapper } from './DomainPropertyMapper.js';

type FindMatchesOptions = {
  /** The template being edited, left out of the result. Omit it for a template not saved yet. */
  templateId?: TemplateInput['_id'];
};

/**
 * The template editor's view of the rules save applies to property names. Every answer comes
 * from the domain, so the editor and the API cannot disagree.
 */
class PropertyMatching {
  /** The name the property will get on save. Save always derives it from the label. */
  static nameFor(property: Pick<PropertyInput, 'label' | 'type' | 'name'>): string {
    return DomainPropertyMapper.toDomain(property, { keepName: false }).name;
  }

  /**
   * Properties of other templates that share the candidate's name, with what would make saving
   * the candidate fail. Other templates are not re-saved, so their stored names are used.
   */
  static findMatches(
    candidate: PropertyInput,
    templates: TemplateInput[],
    { templateId }: FindMatchesOptions = {}
  ): PropertyMatches {
    const editedTemplateId = DomainPropertyMapper.idOf(templateId);
    const property = DomainPropertyMapper.toDomain(candidate, { templateId, keepName: false });

    const matches = templates
      .filter(template => DomainPropertyMapper.idOf(template._id) !== editedTemplateId)
      .flatMap(template =>
        (template.properties ?? []).flatMap(input => {
          const existing = DomainPropertyMapper.toDomain(input, {
            templateId: template._id,
            keepName: true,
          });

          if (existing.name !== property.name) return [];

          return [
            {
              templateId: DomainPropertyMapper.idOf(template._id) ?? '',
              templateName: template.name,
              propertyId: DomainPropertyMapper.idOf(input._id),
              label: input.label,
              type: input.type,
              conflicts: existing.conflictsWith(property),
            },
          ];
        })
      );

    return { name: property.name, matches };
  }

  /**
   * A property of the same template that would get the candidate's name on save. Pass the
   * template as it is in the editor: save re-derives every property name from its current label.
   * The candidate is skipped by `_id`, so a new candidate must not be in `template.properties`.
   */
  static findDuplicateInTemplate(
    candidate: PropertyInput,
    template: Pick<TemplateInput, 'commonProperties' | 'properties'>
  ): TemplateDuplicate | undefined {
    const name = PropertyMatching.nameFor(candidate);
    const candidateId = DomainPropertyMapper.idOf(candidate._id);
    const isOther = (id?: TemplateInput['_id']) =>
      candidateId === undefined || DomainPropertyMapper.idOf(id) !== candidateId;

    const common = (template.commonProperties ?? []).find(p => isOther(p._id) && p.name === name);
    if (common) {
      return {
        propertyId: DomainPropertyMapper.idOf(common._id),
        label: common.label,
        name,
        isCommonProperty: true,
      };
    }

    const sibling = (template.properties ?? []).find(
      p => isOther(p._id) && PropertyMatching.nameFor(p) === name
    );
    if (sibling) {
      return {
        propertyId: DomainPropertyMapper.idOf(sibling._id),
        label: sibling.label,
        name,
        isCommonProperty: false,
      };
    }

    return undefined;
  }
}

export { PropertyMatching };
export type { FindMatchesOptions };
