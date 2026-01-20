import { PropertyAssignment, RelationshipEntry } from '#api/core/domain/template/PropertyValue.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import {
  RelationshipPropertyDoesNotExistError,
  RelationshipTemplateMismatchError,
} from '#api/core/domain/entity/errors.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import {
  CreatePropertyAssignmentInput,
  PropertyAssignmentCreatorService,
} from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';

type Deps = {
  settingsDS: SettingsDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
};

export class RelationshipPropertyAssignmentCreatorService
  implements PropertyAssignmentCreatorService
{
  constructor(private deps: Deps) {}

  // eslint-disable-next-line max-statements
  async create({
    propertyAssignment,
    template,
  }: CreatePropertyAssignmentInput<{ value: string }>): Promise<PropertyAssignment[]> {
    const property = template
      .getPropertyByName<V1RelationshipProperty>(propertyAssignment.name)
      .getDataOrThrow();

    const sharedIds = ArrayUtils.deduplicate(propertyAssignment.value, item => item.value).map(
      pa => pa.value
    );

    const relatedEntities = await (
      await this.deps.entitiesDS.getEntitiesBySharedIds(sharedIds)
    ).all();

    const bySharedId = new Map(relatedEntities.map(e => [e.sharedId, e] as const));

    const missing = sharedIds.filter(id => !bySharedId.has(id));
    if (missing.length) {
      throw new RelationshipPropertyDoesNotExistError(property.name, missing);
    }

    if (property.content) {
      const wrongTemplate = sharedIds.filter(id => {
        const e = bySharedId.get(id)!;
        return e.template.id.toString() !== property.content;
      });

      if (wrongTemplate.length) {
        throw new RelationshipTemplateMismatchError(property.name, property.content, wrongTemplate);
      }
    }

    const languages = await this.deps.settingsDS.getLanguageKeys();

    const assignments: PropertyAssignment[] = [];

    languages.forEach(language => {
      const value = sharedIds.map(id => {
        const related = bySharedId.get(id)!;

        const base: RelationshipEntry = {
          value: id,
          label: related.getTitle(language),
          icon: related.icon,
          type: 'entity',
        };

        if (property.inheritedPropertyId) {
          const inheritedProp = related.template.properties.find(
            p => p.id.toString() === property.inheritedPropertyId
          );
          if (inheritedProp) {
            base.inheritedType = inheritedProp.type;
            base.inheritedValue = related.getValue(inheritedProp.name, language).value;
          }
        }

        return base;
      });

      assignments.push(template.createPropertyAssignment(property.name, { value, language }, true));
    });

    return assignments;
  }
}
