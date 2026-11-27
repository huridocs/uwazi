import type { Application } from 'express';
import request from 'supertest';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { setUpApp } from '#api/utils/testingRoutes.js';
import { searchRoutes } from '../routes.js';
import { setupTestingEnviroment } from './setupTestingEnvironment.js';

const factory = getFixturesFactory();

describe('search v2 metadata with the stems of the search string', () => {
  const app: Application = setUpApp(searchRoutes);

  const searchTitles = async (searchString: string, language = 'en') => {
    const { body } = await request(app)
      .get('/api/v2/search')
      .set('content-language', language)
      .query({ filter: { searchString }, fields: ['title'] })
      .expect(200);
    return body.data.map(({ title }: { title: string }) => title).sort();
  };

  beforeAll(async () => {
    await setupTestingEnviroment(
      {
        templates: [factory.template('template', [factory.property('summary', 'text')])],
        entities: [
          factory.entity('Corporate laws', 'template', {}, { language: 'en', published: true }),
          factory.entity(
            'Entity A',
            'template',
            { summary: [factory.metadataValue('about the law')] },
            { language: 'en', published: true }
          ),
          factory.entity(
            'Derechos de los países',
            'template',
            {},
            { language: 'es', published: true }
          ),
          factory.entity('Unrelated', 'template', {}, { language: 'en', published: true }),
        ],
        files: [
          factory.document('lawyer document', {
            entity: 'Unrelated',
            language: 'eng',
            fullText: { 1: 'a lawyer[[1]]' },
          }),
        ],
      },
      'search_v2_metadata_stemming_test'
    );
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each(['law', 'laws'])('should find every variant of "%s" in metadata', async searchString => {
    expect(await searchTitles(searchString)).toEqual(['Corporate laws', 'Entity A']);
  });

  it('should stem with the language of the request', async () => {
    expect(await searchTitles('pais', 'es')).toEqual(['Derechos de los países']);
  });

  it('should keep quoted words as exact matches', async () => {
    expect(await searchTitles('"laws"')).toEqual(['Corporate laws']);
  });

  it('should not widen the search on document full text', async () => {
    expect(await searchTitles('laws')).not.toContain('Unrelated');
  });
});
