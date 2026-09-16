import { ObjectId } from 'mongodb';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';
import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { EntityUpdatedEvent } from '../EntityUpdatedEvent.js';

const templateId = new ObjectId().toHexString();

const createLoadedEntity = () =>
  new Entity({
    sharedId: 'sharedId',
    template: TemplateBuilder.aTemplate({ id: templateId })
      .withProperties([new TextProperty({ id: 'text', template: templateId, label: 'Text' })])
      .build(),
    translations: (['en', 'es', 'pt'] as const).map(language => ({
      language,
      id: new ObjectId().toHexString(),
      metadata: {
        title: { name: 'title', type: 'text', isTranslatable: true, value: [{ value: 'title' }] },
        creationDate: {
          name: 'creationDate',
          type: 'date',
          isTranslatable: false,
          value: [{ value: 1 }],
        },
        editDate: { name: 'editDate', type: 'date', isTranslatable: false, value: [{ value: 1 }] },
      },
    })),
  });

describe('EntityUpdatedEvent (legacy)', () => {
  describe('fromEntity', () => {
    it('should create a single event with the target language, changed languages and every language row', () => {
      const entity = createLoadedEntity();
      const text = (value: string) =>
        entity.template.createPropertyAssignment('text', { value: [{ value }] });
      entity.setPropertyAssignments([text('english')], 'en');
      entity.setPropertyAssignments([text('português')], 'pt');

      const { before, after, targetLanguageKey, changedLanguages } = EntityUpdatedEvent.fromEntity({
        entity,
        targetLanguage: 'es',
      }).getData();

      expect(targetLanguageKey).toBe('es');
      expect(changedLanguages).toEqual(['en', 'pt']);
      expect(before.map(row => row.language)).toEqual(['en', 'es', 'pt']);
      expect(after.find(row => row.language === 'pt')?.metadata?.text).toEqual([
        { value: 'português' },
      ]);
      expect(before.find(row => row.language === 'pt')?.metadata?.text).toEqual([]);
    });

    it('should list no changed languages when only editDate changed', () => {
      const entity = createLoadedEntity();
      entity.getTranslation('en').refreshEditDate(2);

      expect(
        EntityUpdatedEvent.fromEntity({ entity, targetLanguage: 'en' }).getData().changedLanguages
      ).toEqual([]);
    });
  });

  describe('changedLanguagesOf', () => {
    it('should return the changed languages when present', () => {
      expect(
        EntityUpdatedEvent.changedLanguagesOf({
          before: [],
          after: [],
          targetLanguageKey: 'en',
          changedLanguages: ['es', 'pt'],
        })
      ).toEqual(['es', 'pt']);
    });

    it('should fall back to the target language when the emitter sends no changed languages', () => {
      expect(
        EntityUpdatedEvent.changedLanguagesOf({ before: [], after: [], targetLanguageKey: 'es' })
      ).toEqual(['es']);
    });
  });
});
