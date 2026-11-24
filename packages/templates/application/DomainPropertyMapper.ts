import { DomainError } from '#api/core/domain/error/DomainError.js';
import { Property } from '#api/core/domain/template/Property.js';
import {
  PropertyFactory,
  PropertyFactoryCreateInput,
} from '#api/core/domain/template/PropertyFactory.js';
import type { Id, PropertyInput } from './contracts/TemplateInput.js';

type MapOptions = {
  templateId?: Id;
  /** Keep the stored name instead of deriving one from the label. */
  keepName: boolean;
};

/**
 * Translates the client's shape into domain properties. Holds no rule of its own: names and
 * conflicts come from the domain.
 */
class DomainPropertyMapper {
  static idOf(id?: Id) {
    return id === undefined ? undefined : id.toString();
  }

  static toDomain(input: PropertyInput, { templateId, keepName }: MapOptions): Property {
    const props = {
      id: DomainPropertyMapper.idOf(input._id) ?? '',
      template: DomainPropertyMapper.idOf(templateId) ?? '',
      label: input.label,
      type: input.type,
      name: keepName ? input.name : undefined,
      content: input.content,
      relationType: input.relationType,
      inherit: DomainPropertyMapper.inheritOf(input),
    };

    try {
      return PropertyFactory.create(props as PropertyFactoryCreateInput);
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      // The editor sends properties while they are still being filled in (a select with no
      // thesaurus yet), and the factory does not build every type. Such a property still has a
      // name and a type to match on; checks that need the missing fields start once they are set.
      return new Property(props);
    }
  }

  private static inheritOf({ inherit }: PropertyInput) {
    if (!inherit?.property || !inherit.type) return undefined;
    return { property: inherit.property, type: inherit.type };
  }
}

export { DomainPropertyMapper };
