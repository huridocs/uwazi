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
  describe('create', () => {
    it('should create a single event listing every changed language', () => {
      const entity = createLoadedEntity();
      const text = (value: string) =>
        entity.template.createPropertyAssignment('text', { value: [{ value }] });
      entity.setPropertyAssignments([text('english')], 'en');
      entity.setPropertyAssignments([text('português')], 'pt');

      const event = EntityUpdatedEvent.create({ entity, userId: 'user', targetLanguage: 'es' });

      expect(event?.payload).toEqual({
        targetLanguage: 'es',
        changedLanguages: ['en', 'pt'],
        userId: 'user',
        before: entity.previousVersion.asDTO,
        after: entity.asDTO,
      });
    });

    it('should create no event when no language changed', () => {
      expect(EntityUpdatedEvent.create({ entity: createLoadedEntity(), targetLanguage: 'en' })).toBeNull();
    });
  });

  describe('changedLanguagesOf', () => {
    it('should return the changed languages of the payload', () => {
      const { asDTO } = createLoadedEntity();

      expect(
        EntityUpdatedEvent.changedLanguagesOf({
          before: asDTO,
          after: asDTO,
          targetLanguage: 'en',
          changedLanguages: ['es', 'pt'],
        })
      ).toEqual(['es', 'pt']);
    });

    it('should fall back to the target language of a payload queued before changedLanguages existed', () => {
      const { asDTO } = createLoadedEntity();

      expect(
        EntityUpdatedEvent.changedLanguagesOf({ before: asDTO, after: asDTO, targetLanguage: 'es' })
      ).toEqual(['es']);
    });
  });
});
