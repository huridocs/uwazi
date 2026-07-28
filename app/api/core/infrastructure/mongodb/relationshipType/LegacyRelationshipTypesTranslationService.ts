import translations from '#api/i18n/translations.js';
import { ContextType } from '#shared/translationSchema.js';
import type { RelationshipTypesTranslationService } from '#api/core/application/contracts/RelationshipTypesTranslationService.js';
import type { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';

class LegacyRelationshipTypesTranslationService implements RelationshipTypesTranslationService {
  private readonly contextType = ContextType.relationshipType;

  private readonly translations = translations;

  async create(relationshipType: RelationshipType): Promise<void> {
    const values: Record<string, string> = {
      [relationshipType.name]: relationshipType.name,
    };
    await this.translations.addContext(
      relationshipType.id,
      relationshipType.name,
      values,
      this.contextType
    );
  }

  async update(before: RelationshipType, after: RelationshipType): Promise<void> {
    const updatedLabels: Record<string, string> = {};
    if (before.name !== after.name) {
      updatedLabels[before.name] = after.name;
    }

    const context: Record<string, string> = {
      [after.name]: after.name,
    };

    await this.translations.updateContext(
      {
        id: before.id,
        label: after.name,
        type: this.contextType,
      },
      updatedLabels,
      [],
      context
    );
  }

  async delete(relationshipTypeId: string): Promise<void> {
    await this.translations.deleteContext(relationshipTypeId);
  }
}

export { LegacyRelationshipTypesTranslationService };
