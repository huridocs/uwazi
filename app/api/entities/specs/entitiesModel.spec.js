import entitiesModel from '../entitiesModel';
import testingDB from '../../utils/testing_db';

describe('entitiesModel', () => {
  beforeEach(async () => {
    await testingDB.setupFixturesAndContext({});
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should return the doc saved', async () => {
    const saved = await entitiesModel.save({ title: 'docES', language: 'es' });

    expect(saved.title).toBe('docES');
  });

  it('should return documents saved', async () => {
    const [saved1, saved2] = await entitiesModel.saveMultiple([
      { title: 'doc1' },
      { title: 'doc2' },
    ]);

    expect(saved1.title).toBe('doc1');
    expect(saved2.title).toBe('doc2');
  });

  const expectUnsupportedLangToBeNone = async () =>
    Promise.all([
      entitiesModel.get({ mongoLanguage: 'es' }),
      entitiesModel.get({ mongoLanguage: 'none' }),
      entitiesModel.get({ mongoLanguage: 'ar' }),
      entitiesModel.get({ mongoLanguage: 'ka' }),
      entitiesModel.get({ mongoLanguage: 'sr' }),
    ]).then(([es, none, ar, ka, sr]) => {
      expect(es.length).toBe(1);
      expect(none.length).toBe(3);
      expect(ar.length).toBe(0);
      expect(ka.length).toBe(0);
      expect(sr.length).toBe(0);
    });

  it('should set mongoLanguage to document passed', async () => {
    await Promise.all([
      entitiesModel.save({ title: 'docES', language: 'es' }),
      entitiesModel.save({ title: 'docAR', language: 'ar' }),
      entitiesModel.save({ title: 'docKA', language: 'ka' }),
      entitiesModel.save({ title: 'docSR', language: 'sr' }),
    ]);

    await expectUnsupportedLangToBeNone();
  });

  it('should set mongoLanguage when passing multiple documents', async () => {
    await entitiesModel.saveMultiple([
      { title: 'docES', language: 'es' },
      { title: 'unsupported ar language', language: 'ar' },
      { title: 'unsupported ka language', language: 'ka' },
      { title: 'unsupported sr language', language: 'sr' },
    ]);

    await expectUnsupportedLangToBeNone();
  });

  it('should do not set mongoLanguage when doc.language is undefined', async () => {
    const saved = await entitiesModel.save({ title: 'docES' });

    expect(saved.mongoLanguage).not.toBeDefined();
  });
});
