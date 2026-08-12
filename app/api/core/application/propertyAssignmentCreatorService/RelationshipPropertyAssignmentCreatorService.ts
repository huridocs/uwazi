import { PropertyAssignment, RelationshipEntry } from '#api/core/domain/template/PropertyValue.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import {
  RelationshipPropertyDoesNotExistError,
  RelationshipTemplateMismatchError,
} from '#api/core/domain/entity/errors.js';
import { SettingsDataSource } from '../contracts/SettingsDataSource.js';
import { CreatePropertyAssignmentInput } from './PropertyAssignmentCreatorService.js';
import {
  AbstractPropertyAssignmentCreatorService,
  defaultPropertyAssignmentCreatorServiceContext,
  PropertyAssignmentCreatorServiceContext,
} from './AbstractPropertyAssignmentCreatorService.js';

type Deps = {
  settingsDS: SettingsDataSource;
  entitiesDS: EntitiesDataSource;
};

export class RelationshipPropertyAssignmentCreatorService extends AbstractPropertyAssignmentCreatorService {
  constructor(
    private deps: Deps,
    context: PropertyAssignmentCreatorServiceContext = defaultPropertyAssignmentCreatorServiceContext
  ) {
    super(context);
  }

  // eslint-disable-next-line max-statements
  async create({
    propertyAssignment,
    template,
    entity,
  }: CreatePropertyAssignmentInput<{ value: string }>): Promise<PropertyAssignment[]> {
    const property = template
      .getPropertyByName<V1RelationshipProperty>(propertyAssignment.name)
      .getDataOrThrow();

    const sharedIds = ArrayUtils.deduplicate(propertyAssignment.value, item => item.value).map(
      pa => pa.value
    );

    // Existing relationship values are preserved as-is for entities the actor
    // cannot read; readable entities are re-denormalized (icons, labels,
    // inherited values). This means a collaborator updating an entity does not
    // need read permission on entities that were already in the relationship.
    const existingSharedIds = new Set(
      entity ? entity.getRelationshipValues(property.name).map(v => v.value) : []
    );

    const relatedEntities = await (
      await this.deps.entitiesDS.getEntitiesBySharedIds(sharedIds)
    ).all();

    const readableById = new Map(relatedEntities.map(e => [e.sharedId, e] as const));

    // Entities that could not be read (missing from the permission-enforced
    // fetch) may be unreadable or genuinely missing. Check existence against
    // the UNRESTRICTED view to tell the two apart.
    const unreadable = sharedIds.filter(id => !readableById.has(id));
    if (unreadable.length) {
      const all = await (
        await this.deps.entitiesDS.unrestricted().getEntitiesBySharedIds(unreadable)
      ).all();
      const existingIds = new Set(all.map(e => e.sharedId));

      const genuinelyMissing = unreadable.filter(id => !existingIds.has(id));
      if (genuinelyMissing.length) {
        throw new RelationshipPropertyDoesNotExistError(property.name, genuinelyMissing);
      }

      const unreadableNew = unreadable.filter(id => !existingSharedIds.has(id));
      if (unreadableNew.length) {
        throw new RelationshipPropertyDoesNotExistError(property.name, unreadableNew);
      }
      // Exists but unreadable + already in relationship → preserve existing value.
    }

    if (property.content) {
      const wrongTemplate = sharedIds.filter(id => {
        const e = readableById.get(id);
        return e && e.template.id.toString() !== property.content;
      });

      if (wrongTemplate.length) {
        throw new RelationshipTemplateMismatchError(property.name, property.content, wrongTemplate);
      }
    }

    const languages = await this.deps.settingsDS.getLanguageKeys();

    const assignments: PropertyAssignment[] = [];

    languages.forEach(language => {
      const existingForLanguage = entity
        ? entity
            .getRelationshipValues(property.name, language)
            .filter(v => sharedIds.includes(v.value))
        : [];

      const value = sharedIds.map(id => {
        const related = readableById.get(id);

        if (!related) {
          // Unreadable entity that was already in the relationship — preserve
          // the existing value instead of failing the whole update.
          return existingForLanguage.find(v => v.value === id)!;
        }

        const base: RelationshipEntry = {
          value: id,
          label: related.getTitle(language),
          type: 'entity',
        };

        if (related.icon) {
          base.icon = related.icon;
        }

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

      assignments.push(
        template.createPropertyAssignment(
          property.name,
          { value, language },
          this.context.validateRequired
        )
      );
    });

    return assignments;
  }
}
