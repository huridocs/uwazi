import type { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { Property } from '#api/core/domain/template/Property.js';
import type { PropertyConflict } from '#api/core/domain/template/PropertyConflict.js';
import {
  PropertyFactory,
  PropertyFactoryCreateInput,
} from '#api/core/domain/template/PropertyFactory.js';
import type { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { AbstractSelectProperty } from '#api/core/domain/template/select/AbstractSelectProperty.js';
import { Template } from '#api/core/domain/template/Template.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';

type Inherit = { property: string; type: PropertyType };

type PropertyCandidate = {
  label: string;
  type: PropertyType;
  templateId?: string;
  content?: string;
  relationType?: string;
  inherit?: Inherit;
};

type PropertyMatchReadModel = {
  templateId: string;
  templateName: string;
  propertyId: string;
  label: string;
  type: PropertyType;
  content?: string;
  relationType?: string;
  inherit?: Inherit;
  conflicts: PropertyConflict[];
};

type PropertyMatchesReadModel = {
  name: string;
  matches: PropertyMatchReadModel[];
};

type Deps = {
  templatesDS: TemplatesDataSource;
};

/** The candidate is never persisted, so its id only has to satisfy the domain model. */
const CANDIDATE_ID = 'candidate';

class TemplatesQueryService {
  constructor(private deps: Deps) {}

  /**
   * Properties in other templates that share the name the candidate would get on save,
   * each with the conflicts that would make saving the candidate fail.
   */
  async getPropertyMatches(candidate: PropertyCandidate): Promise<PropertyMatchesReadModel> {
    const property = PropertyFactory.create({
      ...candidate,
      id: CANDIDATE_ID,
      template: candidate.templateId ?? '',
    } as PropertyFactoryCreateInput);

    const templates = await this.deps.templatesDS.getTemplatesByPropertyName(property);

    const matches = templates.flatMap(template =>
      template.properties
        .filter(existing => existing.name === property.name)
        .map(existing =>
          TemplatesQueryService.toMatch(template, existing, existing.conflictsWith(property))
        )
    );

    return { name: property.name, matches };
  }

  private static toMatch(
    template: Template,
    property: Property,
    conflicts: PropertyConflict[]
  ): PropertyMatchReadModel {
    return {
      templateId: template.id,
      templateName: template.name,
      propertyId: property.id,
      label: property.label,
      type: property.type,
      ...TemplatesQueryService.configurationOf(property),
      conflicts,
    };
  }

  private static configurationOf(
    property: Property
  ): Pick<PropertyMatchReadModel, 'content' | 'relationType' | 'inherit'> {
    if (property instanceof AbstractSelectProperty) {
      return { content: property.content };
    }

    if (property instanceof V1RelationshipProperty) {
      return {
        content: property.content,
        relationType: property.relationType,
        ...(property.inherit && { inherit: property.inherit }),
      };
    }

    return {};
  }
}

export { TemplatesQueryService };
export type { PropertyCandidate, PropertyMatchReadModel, PropertyMatchesReadModel };
