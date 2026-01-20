import { Context, Property } from '#api/core/domain/template/Property.js';
import { RelationshipTypesDataSource } from '#api/relationshiptypes.v2/contracts/RelationshipTypesDataSource.js';
import {
  V1RelationshipProperty,
  V1RelationshipPropertyProps,
} from '#api/core/domain/template/V1RelationshipProperty.js';
import { AbstractPropertyCreatorService } from '#api/core/application/propertyCreatorService/AbstractPropertyCreatorService.js';
import {
  RelationshipTargetPropertyNotFoundError,
  RelationshipTargetTypeMismatchError,
  RelationshipTypeDoesNotExistError,
} from '#api/core/domain/template/errors.js';
import { AbstractPropertyCreatorService } from '#api/core/application/propertyCreatorService/AbstractPropertyCreatorService.js';

type Deps = {
  relationshipTypesDS: RelationshipTypesDataSource;
};

class RelationshipPropertyCreatorService extends AbstractPropertyCreatorService<Deps> {
  // eslint-disable-next-line class-methods-use-this
  async createProperty(input: V1RelationshipPropertyProps, context: Context): Promise<Property> {
    const property = V1RelationshipProperty.create(input, context);

    const relationshipTypeExists = await this.deps.relationshipTypesDS.typesExist([
      property.relationType,
    ]);

    if (!relationshipTypeExists) {
      throw new RelationshipTypeDoesNotExistError(property.relationType);
    }

    if (property.content && property.inherit) {
      const targetTemplate = (
        await this.deps.templatesDS.getById(property.content)
      ).getDataOrThrow();

      const targetProperty = targetTemplate.getPropertyById(property.inherit.property);
      if (!targetProperty) {
        throw new RelationshipTargetPropertyNotFoundError(
          property.inherit.property,
          property.content
        );
      }

      if (targetProperty.type !== property.inherit.type) {
        throw new RelationshipTargetTypeMismatchError(property.inherit.type, targetProperty.type);
      }
    }

    return property;
  }
}

export { RelationshipPropertyCreatorService };
