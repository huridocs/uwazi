import { Entity } from '#api/core/domain/entity/Entity.js';
import { EntityUpdatedEvent } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { TextProperty } from '../../template/TextProperty.js';
import { TemplateBuilder } from '../../template/specs/TemplateBuilder.js';

const createLoadedEntity = () =>
  new Entity({
    sharedId: 'sharedId',
    template: TemplateBuilder.aTemplate({ id: 'template' })
      .withProperties([new TextProperty({ id: 'text', template: 'template', label: 'Text' })])
      .build(),
    translations: [
      { language: 'en', id: 'id_en' },
      { language: 'es', id: 'id_es' },
      { language: 'pt', id: 'id_pt' },
    ],
  });

describe('EntityUpdatedEvent', () => {
  describe('createForChangedLanguages', () => {
    it('should create one event per changed language', () => {
      const entity = createLoadedEntity();
      const text = (value: string) =>
        entity.template.createPropertyAssignment('text', { value: [{ value }] });
      entity.setPropertyAssignments([text('english')], 'en');
      entity.setPropertyAssignments([text('português')], 'pt');

      const events = EntityUpdatedEvent.createForChangedLanguages({ entity, userId: 'user' });

      expect(events.map(event => event.payload)).toEqual([
        {
          targetLanguage: 'en',
          userId: 'user',
          before: entity.previousVersion.asDTO,
          after: entity.asDTO,
        },
        {
          targetLanguage: 'pt',
          userId: 'user',
          before: entity.previousVersion.asDTO,
          after: entity.asDTO,
        },
      ]);
    });

    it('should create no events when nothing changed', () => {
      expect(
        EntityUpdatedEvent.createForChangedLanguages({ entity: createLoadedEntity() })
      ).toEqual([]);
    });
  });
});
