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
  describe('createForChangedLanguages', () => {
    it('should create one event per changed language with every language row', () => {
      const entity = createLoadedEntity();
      const text = (value: string) =>
        entity.template.createPropertyAssignment('text', { value: [{ value }] });
      entity.setPropertyAssignments([text('english')], 'en');
      entity.setPropertyAssignments([text('português')], 'pt');

      const events = EntityUpdatedEvent.createForChangedLanguages({ entity });

      expect(events.map(event => event.getData().targetLanguageKey)).toEqual(['en', 'pt']);
      events.forEach(event => {
        const { before, after } = event.getData();
        expect(before.map(row => row.language)).toEqual(['en', 'es', 'pt']);
        expect(after.find(row => row.language === 'pt')?.metadata?.text).toEqual([
          { value: 'português' },
        ]);
        expect(before.find(row => row.language === 'pt')?.metadata?.text).toEqual([]);
      });
    });

    it('should create no events when nothing changed', () => {
      expect(
        EntityUpdatedEvent.createForChangedLanguages({ entity: createLoadedEntity() })
      ).toEqual([]);
    });
  });
});
