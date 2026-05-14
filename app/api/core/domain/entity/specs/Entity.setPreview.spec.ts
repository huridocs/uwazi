import { Entity } from '#api/core/domain/entity/Entity.js';
import { FileBuilder } from '../../files/specs/FileBuilder.js';
import { TemplateBuilder } from '../../template/specs/TemplateBuilder.js';

const createTemplate = () =>
  TemplateBuilder.aTemplate({ id: 'template-1' }).withProperties([]).build();

const createEntity = (languages: string[]) =>
  new Entity({
    sharedId: 'shared-1',
    template: createTemplate(),
    translations: languages.map(l => ({ language: l as any })),
  });

describe('Entity.setPreview', () => {
  it('should set preview for each language matching the entity language', () => {
    const entity = createEntity(['en', 'es', 'fr']);

    const thumbnails = [
      FileBuilder.thumbnail('t1', { language: 'en', filename: 'thumb_en.jpg', entity: 'shared-1' }),
      FileBuilder.thumbnail('t2', { language: 'es', filename: 'thumb_es.jpg', entity: 'shared-1' }),
      FileBuilder.thumbnail('t3', { language: 'fr', filename: 'thumb_fr.jpg', entity: 'shared-1' }),
    ];

    entity.setPreview(thumbnails, 'en');

    expect(entity.translations.en.preview).toBe('thumb_en.jpg');
    expect(entity.translations.es.preview).toBe('thumb_es.jpg');
    expect(entity.translations.fr.preview).toBe('thumb_fr.jpg');
  });

  it('should fall back to the default language thumbnail when no exact match', () => {
    const entity = createEntity(['en', 'es', 'pt']);

    const thumbnails = [
      FileBuilder.thumbnail('t1', { language: 'en', filename: 'thumb_en.jpg', entity: 'shared-1' }),
      FileBuilder.thumbnail('t2', { language: 'es', filename: 'thumb_es.jpg', entity: 'shared-1' }),
      // no 'pt' thumbnail
    ];

    entity.setPreview(thumbnails, 'en');

    expect(entity.translations.en.preview).toBe('thumb_en.jpg');
    expect(entity.translations.es.preview).toBe('thumb_es.jpg');
    // 'pt' falls back to default language 'en'
    expect(entity.translations.pt.preview).toBe('thumb_en.jpg');
  });

  it('should fall back to the first thumbnail when neither language nor default match', () => {
    const entity = createEntity(['fr', 'de']);

    const thumbnails = [
      FileBuilder.thumbnail('t1', { language: 'es', filename: 'thumb_es.jpg', entity: 'shared-1' }),
    ];

    // default language is 'en', not in thumbnails
    entity.setPreview(thumbnails, 'en');

    expect(entity.translations.fr.preview).toBe('thumb_es.jpg');
    expect(entity.translations.de.preview).toBe('thumb_es.jpg');
  });

  it('should set preview to undefined for all languages when thumbnails list is empty', () => {
    const entity = createEntity(['en', 'es']);

    // Set an initial preview value
    entity.translations.en.preview = 'old_thumb.jpg';
    entity.translations.es.preview = 'old_thumb.jpg';

    entity.setPreview([], 'en');

    expect(entity.translations.en.preview).toBeUndefined();
    expect(entity.translations.es.preview).toBeUndefined();
  });
});
